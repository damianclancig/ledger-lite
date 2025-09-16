'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentCategory } from '@/lib/actions-helpers';
import type { Category, CategoryFormValues } from '@/types';
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
      const systemTaxesCategory = await categoriesCollection.findOne({ userId, name: "Taxes", isSystem: true });
      if (!systemTaxesCategory) {
        const legacyTaxesCategory = await categoriesCollection.findOne({
          userId,
          name: { $in: ["Taxes", "Impuestos", "Impostos"] }
        });

        if (legacyTaxesCategory) {
          // Found a legacy tax category, update it
          await categoriesCollection.updateOne(
            { _id: legacyTaxesCategory._id },
            { $set: { name: "Taxes", isSystem: true } }
          );
        } else {
          // No legacy tax category found, create a new system one
          const taxesCategoryData = CATEGORIES.find(c => c.key === "Taxes");
          if (taxesCategoryData) {
            await categoriesCollection.insertOne({
              name: taxesCategoryData.key,
              userId,
              isEnabled: true,
              isSystem: taxesCategoryData.isSystem,
            });
          }
        }
      }
    }

    const categories = await categoriesCollection.find({ userId }).sort({ name: 1 }).toArray();
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

export async function addCategory(data: CategoryFormValues, userId: string): Promise<Category | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { categoriesCollection } = await getDb();
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

export async function updateCategory(id: string, data: CategoryFormValues, userId: string): Promise<Category | { error: string }> {
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
