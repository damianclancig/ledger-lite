'use server';

import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentTax } from '@/lib/actions-helpers';
import type { Tax, TaxFormValues, Translations } from '@/types';
import {
  validateUserId,
  validateUserAndId,
} from '@/lib/validation-helpers';
import {
  handleActionError,
  type ErrorResponse,
} from '@/lib/error-helpers';
import {
  revalidateUserTag,
  CacheTag,
} from '@/lib/cache-helpers';

export async function getTaxes(userId: string): Promise<Tax[] | ErrorResponse> {
  try {
    validateUserId(userId);
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
    return handleActionError(error, 'fetch taxes');
  }
}

export async function getTaxById(id: string, userId: string): Promise<Tax | ErrorResponse> {
  try {
    validateUserAndId(userId, id, 'tax ID');
    
    const { taxesCollection } = await getDb();
    const tax = await taxesCollection.findOne({ _id: new ObjectId(id), userId });
    
    if (!tax) {
      return { error: 'Tax not found.' };
    }
    
    return mapMongoDocumentTax(tax);
  } catch (error) {
    return handleActionError(error, 'fetch tax');
  }
}

export async function getUniqueTaxNames(userId: string): Promise<string[] | ErrorResponse> {
  try {
    validateUserId(userId);
    
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
    return handleActionError(error, 'fetch tax names');
  }
}

export async function addTax(data: TaxFormValues, userId: string, translations: Translations): Promise<Tax | ErrorResponse> {
  try {
    validateUserId(userId);
    
    const { name, amount, month, year } = data;
    const { taxesCollection } = await getDb();

    // Check for duplicates
    const existingTax = await taxesCollection.findOne({
      userId,
      name,
      month,
      year
    });

    if (existingTax) {
      return { error: translations.taxExistsError };
    }
    
    const documentToInsert = {
      name,
      amount,
      month,
      year,
      userId,
      isPaid: false
    };
    
    const result = await taxesCollection.insertOne(documentToInsert);
    const insertedId = result.insertedId;

    revalidateUserTag(userId, CacheTag.TAXES);
    
    const newTax = await taxesCollection.findOne({ _id: insertedId });
    if (!newTax) {
      throw new Error('Could not find the newly created tax.');
    }
    
    return mapMongoDocumentTax(newTax);
  } catch (error) {
    return handleActionError(error, 'add tax');
  }
}

export async function updateTax(id: string, data: Partial<Pick<Tax, 'name' | 'amount' | 'month' | 'year'>>, userId: string, translations: Translations): Promise<Tax | ErrorResponse> {
  try {
    validateUserAndId(userId, id, 'tax ID');
    
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

    revalidateUserTag(userId, CacheTag.TAXES);
    
    const updatedTax = await taxesCollection.findOne({ _id: new ObjectId(id) });
    if (!updatedTax) {
      throw new Error('Could not find the updated tax.');
    }
    
    return mapMongoDocumentTax(updatedTax);
  } catch (error) {
    return handleActionError(error, 'update tax');
  }
}
