'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentCategory } from '@/lib/actions-helpers';
import type { Category, CategoryFormValues, Translations } from '@/types';
import { CATEGORIES } from "@/types";

async function seedDefaultCategories(userId: string) {
  const { categoriesCollection } = await getDb();
  const defaultCategories = CATEGORIES.map(cat => ({
    name: cat.key,
    userId,
    isEnabled: true,
    isSystem: cat.isSystem,
  }));
  await categoriesCollection.insertMany(defaultCategories);
}

export async function getCategories(userId: string): Promise<Category[]> {
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
           });
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

export async function getCategoryById(id: string, userId: string): Promise<Category | null> {
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

export async function addCategory(data: CategoryFormValues, userId: string, translations: Translations): Promise<Category | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { categoriesCollection } = await getDb();
    
    // Check for duplicates (case-insensitive)
    const existingCategory = await categoriesCollection.findOne({
        userId,
        name: { $regex: `^${data.name}$`, $options: 'i' }
    });

    if (existingCategory) {
        return { error: translations.categoryExistsError };
    }

    const documentToInsert = { ...data, userId, isSystem: false }; // User-added categories are not system categories
    const result = await categoriesCollection.insertOne(documentToInsert);
    
    if (!result.insertedId) {
      throw new Error('Failed to insert category.');
    }

    revalidateTag(`categories_${userId}`);
    const newCategory = await categoriesCollection.findOne({ _id: result.insertedId });
     if (!newCategory) {
        throw new Error('Could not find the newly created category.');
    }
    return mapMongoDocumentCategory(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to add category. ${errorMessage}` };
  }
}

export async function updateCategory(id: string, data: CategoryFormValues, userId: string, translations: Translations): Promise<Category | { error: string }> {
  if (!ObjectId.isValid(id)) {
    return { error: 'Invalid category ID.' };
  }
  if (!userId) return { error: 'User not authenticated.' };
  try {
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

    const result = await categoriesCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return { error: 'Category not found or you do not have permission to edit it.' };
    }

    revalidateTag(`categories_${userId}`);
    const updatedCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
     if (!updatedCategory) {
        throw new Error('Could not find the updated category.');
    }
    return mapMongoDocumentCategory(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to update category. ${errorMessage}` };
  }
}

export async function isCategoryInUse(categoryId: string, userId: string): Promise<boolean> {
  if (!ObjectId.isValid(categoryId) || !userId) {
    return false;
  }
  try {
    const { transactionsCollection } = await getDb();
    const count = await transactionsCollection.countDocuments({ categoryId, userId });
    return count > 0;
  } catch (error) {
    console.error('Error checking if category is in use:', error);
    return true; // Fail safe
  }
}

export async function deleteCategory(id: string, userId: string, translations: Translations): Promise<{ success: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) {
    return { success: false, error: 'Invalid category ID.' };
  }
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const { categoriesCollection } = await getDb();

    const categoryToDelete = await categoriesCollection.findOne({ _id: new ObjectId(id), userId });
    if (!categoryToDelete) {
      return { success: false, error: 'Category not found or you do not have permission to delete it.' };
    }

    if (categoryToDelete.isSystem) {
      return { success: false, error: 'System categories cannot be deleted.' };
    }

    const inUse = await isCategoryInUse(id, userId);
    if (inUse) {
      return { success: false, error: translations.categoryInUseError };
    }
    
    const result = await categoriesCollection.deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Category not found during deletion.' };
    }
    
    revalidateTag(`categories_${userId}`);
    return { success: true };

  } catch (error) {
    console.error('Error deleting category:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete category. ${errorMessage}` };
  }
}