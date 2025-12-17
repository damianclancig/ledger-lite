'use server';

import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentCategory } from '@/lib/actions-helpers';
import { isCategoryInUse as checkCategoryInUse } from '@/lib/database-helpers';
import { validateObjectId } from '@/lib/validation-helpers';
import { handleActionError } from '@/lib/error-helpers';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { revalidateUserTag, CacheTag } from '@/lib/cache-helpers';
import type { Category, CategoryFormValues, Translations } from '@/types';
import { CATEGORIES } from "@/types";
import { DEFAULT_CATEGORY_ICONS, isValidCategoryIcon } from '@/lib/category-icons';

async function seedDefaultCategories(userId: string) {
  const { categoriesCollection } = await getDb();
  const defaultCategories = CATEGORIES.map(cat => ({
    name: cat.key,
    userId,
    isEnabled: true,
    isSystem: cat.isSystem,
    icon: DEFAULT_CATEGORY_ICONS[cat.key], // Assign default icon if available
  }));
  await categoriesCollection.insertMany(defaultCategories);
}


export async function getCategories(): Promise<Category[]> {
  const { id } = await getAuthenticatedUser();
  return getInternalCategories(id);
}

export async function getInternalCategories(userId: string): Promise<Category[]> {
  if (!userId) return [];
  try {
    const { categoriesCollection } = await getDb();
    const userCategoriesCount = await categoriesCollection.countDocuments({ userId });

    if (userCategoriesCount === 0) {
      await seedDefaultCategories(userId);
    } else {
      // One-time migration logic for existing users
      const systemCategoryKeys = CATEGORIES.filter(c => c.isSystem).map(c => c.key);
      const systemCategoriesInDb = await categoriesCollection.find({ userId, isSystem: true }).toArray();

      // Demote categories that are no longer system categories
      for (const dbCat of systemCategoriesInDb) {
        if (!systemCategoryKeys.includes(dbCat.name)) {
          await categoriesCollection.updateOne({ _id: dbCat._id }, { $set: { isSystem: false } });
        }
      }

      // Promote or create system categories
      for (const sysCatKey of systemCategoryKeys) {
        const sysCatDef = CATEGORIES.find(c => c.key === sysCatKey)!;
        const existingCategory = await categoriesCollection.findOne({ userId, name: sysCatKey });

        if (existingCategory) {
          if (existingCategory.isSystem !== true) {
            await categoriesCollection.updateOne(
              { _id: existingCategory._id },
              { $set: { isSystem: true } }
            );
          }
        } else {
          await categoriesCollection.insertOne({
            name: sysCatDef.key,
            userId,
            isEnabled: true,
            isSystem: true,
            icon: DEFAULT_CATEGORY_ICONS[sysCatDef.key], // Assign default icon
          });
        }
      }

      // Migrate existing system categories to have default icons if they don't have one
      for (const sysCatKey of systemCategoryKeys) {
        const defaultIcon = DEFAULT_CATEGORY_ICONS[sysCatKey];
        if (defaultIcon) {
          await categoriesCollection.updateOne(
            { userId, name: sysCatKey, icon: { $exists: false } },
            { $set: { icon: defaultIcon } }
          );
        }
      }

      // Ensure all other non-system categories have isSystem: false
      await categoriesCollection.updateMany(
        { userId, name: { $nin: systemCategoryKeys }, isSystem: { $ne: false } },
        { $set: { isSystem: false } }
      );
    }

    const categories = await categoriesCollection.find({ userId }).sort({ isSystem: -1, name: 1 }).toArray();
    return categories.map(mapMongoDocumentCategory);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { id: userId } = await getAuthenticatedUser();
  if (!ObjectId.isValid(id) || !userId) {
    return null;
  }
  try {
    const { categoriesCollection } = await getDb();
    const category = await categoriesCollection.findOne({ _id: new ObjectId(id), userId });
    return category ? mapMongoDocumentCategory(category) : null;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    return null;
  }
}

export async function addCategory(data: CategoryFormValues, translations: Translations): Promise<Category | { error: string }> {
  try {
    const { id: userId } = await getAuthenticatedUser();
    const { categoriesCollection } = await getDb();

    // Check for duplicates (case-insensitive)
    const existingCategory = await categoriesCollection.findOne({
      userId,
      name: { $regex: `^${data.name}$`, $options: 'i' }
    });

    if (existingCategory) {
      return { error: translations.categoryExistsError };
    }

    // Validate icon if provided
    if (data.icon && !isValidCategoryIcon(data.icon)) {
      return { error: 'Invalid icon selected.' };
    }

    const documentToInsert = { ...data, userId, isSystem: false }; // User-added categories are not system categories
    const result = await categoriesCollection.insertOne(documentToInsert);

    if (!result.insertedId) {
      throw new Error('Failed to insert category.');
    }

    revalidateUserTag(userId, CacheTag.CATEGORIES);
    const newCategory = await categoriesCollection.findOne({ _id: result.insertedId });
    if (!newCategory) {
      throw new Error('Could not find the newly created category.');
    }
    return mapMongoDocumentCategory(newCategory);
  } catch (error) {
    return handleActionError(error, 'add category');
  }
}

export async function updateCategory(id: string, data: CategoryFormValues, translations: Translations): Promise<Category | { error: string }> {
  try {
    const { id: userId } = await getAuthenticatedUser();
    validateObjectId(id, 'category ID');
    const { categoriesCollection } = await getDb();

    // Prevent updating system categories
    const categoryToUpdate = await categoriesCollection.findOne({ _id: new ObjectId(id), userId });
    if (categoryToUpdate?.isSystem) {
      return { error: 'System categories cannot be modified.' };
    }

    // Check for duplicates on name change (case-insensitive)
    if (data.name.toLowerCase() !== categoryToUpdate?.name.toLowerCase()) {
      const existingCategory = await categoriesCollection.findOne({
        userId,
        name: { $regex: `^${data.name}$`, $options: 'i' },
        _id: { $ne: new ObjectId(id) } // Exclude the current document
      });

      if (existingCategory) {
        return { error: translations.categoryExistsError };
      }
    }

    // Validate icon if provided
    if (data.icon && !isValidCategoryIcon(data.icon)) {
      return { error: 'Invalid icon selected.' };
    }

    const result = await categoriesCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      return { error: 'Category not found or you do not have permission to edit it.' };
    }

    revalidateUserTag(userId, CacheTag.CATEGORIES);
    const updatedCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
    if (!updatedCategory) {
      throw new Error('Could not find the updated category.');
    }
    return mapMongoDocumentCategory(updatedCategory);
  } catch (error) {
    return handleActionError(error, 'update category');
  }
}

export async function isCategoryInUse(categoryId: string): Promise<boolean> {
  const { id: userId } = await getAuthenticatedUser();
  if (!ObjectId.isValid(categoryId) || !userId) {
    return false;
  }
  try {
    const { transactionsCollection } = await getDb();
    return await checkCategoryInUse(categoryId, userId, transactionsCollection);
  } catch (error) {
    console.error('Error checking if category is in use:', error);
    return true; // Fail safe
  }
}

export async function deleteCategory(id: string, translations: Translations): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: userId } = await getAuthenticatedUser();
    validateObjectId(id, 'category ID');
    const { categoriesCollection } = await getDb();

    const categoryToDelete = await categoriesCollection.findOne({ _id: new ObjectId(id), userId });
    if (!categoryToDelete) {
      return { success: false, error: 'Category not found or you do not have permission to delete it.' };
    }

    if (categoryToDelete.isSystem) {
      return { success: false, error: 'System categories cannot be deleted.' };
    }

    const inUse = await isCategoryInUse(id);
    if (inUse) {
      return { success: false, error: translations.categoryInUseError };
    }

    const result = await categoriesCollection.deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Category not found during deletion.' };
    }

    revalidateUserTag(userId, CacheTag.CATEGORIES);
    return { success: true };

  } catch (error) {
    return { success: false, ...handleActionError(error, 'delete category') };
  }
}