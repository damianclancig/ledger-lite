
'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentTax } from '@/lib/actions-helpers';
import type { Tax, TaxFormValues, Translations } from '@/types';

export async function getTaxes(userId: string): Promise<Tax[]> {
  if (!userId) return [];
  try {
    const { taxesCollection } = await getDb();

    // One-time migration for documents without a 'year'
    const legacyTaxes = await taxesCollection.find({ userId, year: { $exists: false } }).toArray();

    if (legacyTaxes.length > 0) {
      const bulkOps = [];
      for (const tax of legacyTaxes) {
        let year = new Date(tax.date).getUTCFullYear();
        let month = new Date(tax.date).getUTCMonth();

        // Check if a document with the new values already exists
        let existing = await taxesCollection.findOne({ userId, name: tax.name, month, year });
        
        while (existing) {
          // If it exists, increment the month and possibly the year
          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
          existing = await taxesCollection.findOne({ userId, name: tax.name, month, year });
        }
        
        bulkOps.push({
          updateOne: {
            filter: { _id: tax._id },
            update: { $set: { year, month, date: new Date(tax.date) } }
          }
        });
      }
      if (bulkOps.length > 0) {
        await taxesCollection.bulkWrite(bulkOps);
      }
    }

    const taxes = await taxesCollection.find({ userId }).sort({ year: -1, month: -1 }).toArray();
    return taxes.map(mapMongoDocumentTax);
  } catch (error) {
    console.error('Error fetching and migrating taxes:', error);
    return [];
  }
}

export async function getTaxById(id: string, userId: string): Promise<Tax | null> {
  if (!ObjectId.isValid(id) || !userId) {
    return null;
  }
  try {
    const { taxesCollection } = await getDb();
    const tax = await taxesCollection.findOne({ _id: new ObjectId(id), userId });
    return tax ? mapMongoDocumentTax(tax) : null;
  } catch (error) {
    console.error('Error fetching tax by ID:', error);
    return null;
  }
}

export async function getUniqueTaxNames(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const { taxesCollection } = await getDb();
    const pipeline = [
      { $match: { userId: userId } },
      { $group: { _id: "$name" } },
      { $sort: { _id: 1 } },
      { $project: { name: "$_id", _id: 0 } }
    ];
    const results = await taxesCollection.aggregate(pipeline).toArray();
    return results.map((r: any) => r.name);
  } catch (error) {
    console.error('Error fetching unique tax names:', error);
    return [];
  }
}

export async function addTax(data: TaxFormValues, userId: string, translations: Translations): Promise<{ success: boolean, error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
  
    const { name, amount, month, year } = data;
  
    try {
      const { taxesCollection } = await getDb();

      // Check for duplicates
      const existingTax = await taxesCollection.findOne({
        userId,
        name,
        month,
        year
      });

      if (existingTax) {
        return { success: false, error: translations.taxExistsError };
      }
      
      const documentToInsert = {
        name,
        amount,
        month,
        year,
        userId,
        isPaid: false
      };
      
      await taxesCollection.insertOne(documentToInsert);
  
      revalidateTag(`taxes_${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error adding tax record:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Failed to add tax record. ${errorMessage}` };
    }
  }


  export async function updateTax(id: string, data: Partial<Pick<Tax, 'name' | 'amount' | 'month' | 'year'>>, userId: string, translations: Translations): Promise<Tax | { error: string }> {
    if (!ObjectId.isValid(id)) {
      return { error: 'Invalid tax ID.' };
    }
    if (!userId) return { error: 'User not authenticated.' };
    
    try {
      const { taxesCollection } = await getDb();
      
      const existingTax = await taxesCollection.findOne({ _id: new ObjectId(id), userId });
      if (!existingTax) {
        return { error: 'Tax not found or you do not have permission to edit it.' };
      }
  
      if (existingTax.isPaid) {
        return { error: translations.paidTaxEditError };
      }
      
      // Check for duplicates if critical fields are changing
      if (data.name || data.month || data.year) {
        const potentialDuplicate = await taxesCollection.findOne({
          userId,
          name: data.name ?? existingTax.name,
          month: data.month ?? existingTax.month,
          year: data.year ?? existingTax.year,
          _id: { $ne: new ObjectId(id) } // Exclude the current document
        });
        if (potentialDuplicate) {
          return { error: translations.taxExistsError };
        }
      }

      const result = await taxesCollection.updateOne(
        { _id: new ObjectId(id), userId },
        { $set: data }
      );
      
      if (result.matchedCount === 0) {
        return { error: 'Tax not found or you do not have permission to edit it.' };
      }
  
      revalidateTag(`taxes_${userId}`);
      const updatedTax = await taxesCollection.findOne({ _id: new ObjectId(id) });
       if (!updatedTax) {
          throw new Error('Could not find the updated tax.');
      }
      return mapMongoDocumentTax(updatedTax);
    } catch (error) {
      console.error('Error updating tax:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { error: `Failed to update tax. ${errorMessage}` };
    }
  }

