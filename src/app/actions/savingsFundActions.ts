
'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentSavingsFund } from '@/lib/actions-helpers';
import type { SavingsFund, SavingsFundFormValues, Translations } from '@/types';
import { addTransaction } from './transactionActions';

export async function getSavingsFunds(userId: string): Promise<SavingsFund[]> {
  if (!userId) return [];
  try {
    const { savingsFundsCollection, transactionsCollection } = await getDb();
    const funds = await savingsFundsCollection.find({ userId }).sort({ name: 1 }).toArray();

    // Calculate current amount for each fund
    const fundsWithCurrentAmount = await Promise.all(funds.map(async (fund) => {
        const fundIdStr = fund._id.toString();
        const transactions = await transactionsCollection.find({ userId, savingsFundId: fundIdStr }).toArray();
        const currentAmount = transactions.reduce((acc, t) => {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense') return acc - t.amount;
            return acc;
        }, 0);
        
        return {
            ...mapMongoDocumentSavingsFund(fund),
            currentAmount,
        };
    }));

    return fundsWithCurrentAmount;
  } catch (error) {
    console.error('Error fetching savings funds:', error);
    return [];
  }
}

export async function getSavingsFundById(id: string, userId: string): Promise<SavingsFund | null> {
    if (!ObjectId.isValid(id) || !userId) {
      return null;
    }
    try {
      const { savingsFundsCollection, transactionsCollection } = await getDb();
      const fund = await savingsFundsCollection.findOne({ _id: new ObjectId(id), userId });
      if (!fund) return null;
  
      const fundIdStr = fund._id.toString();
      const transactions = await transactionsCollection.find({ userId, savingsFundId: fundIdStr }).toArray();
      const currentAmount = transactions.reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense') return acc - t.amount;
        return acc;
      }, 0);
      
      return {
        ...mapMongoDocumentSavingsFund(fund),
        currentAmount,
      };
    } catch (error) {
      console.error('Error fetching savings fund by ID:', error);
      return null;
    }
}

export async function addSavingsFund(data: SavingsFundFormValues, userId: string): Promise<SavingsFund | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { savingsFundsCollection } = await getDb();
    
    const documentToInsert = { 
        ...data, 
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        userId,
    };
    
    const result = await savingsFundsCollection.insertOne(documentToInsert);
    
    if (!result.insertedId) {
      throw new Error('Failed to insert savings fund.');
    }

    revalidateTag(`savingsFunds_${userId}`);
    const newFund = await savingsFundsCollection.findOne({ _id: result.insertedId });
     if (!newFund) {
        throw new Error('Could not find the newly created savings fund.');
    }
    return { ...mapMongoDocumentSavingsFund(newFund), currentAmount: 0 };
  } catch (error) {
    console.error('Error adding savings fund:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to add savings fund. ${errorMessage}` };
  }
}

export async function updateSavingsFund(id: string, data: SavingsFundFormValues, userId: string): Promise<SavingsFund | { error: string }> {
  if (!ObjectId.isValid(id)) {
    return { error: 'Invalid savings fund ID.' };
  }
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { savingsFundsCollection } = await getDb();
    
    const documentToUpdate = { 
        ...data, 
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    };

    const result = await savingsFundsCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: documentToUpdate }
    );
    
    if (result.matchedCount === 0) {
      return { error: 'Savings fund not found or you do not have permission to edit it.' };
    }

    revalidateTag(`savingsFunds_${userId}`);
    const updatedFund = await savingsFundsCollection.findOne({ _id: new ObjectId(id) });
     if (!updatedFund) {
        throw new Error('Could not find the updated savings fund.');
    }
    return mapMongoDocumentSavingsFund(updatedFund);
  } catch (error) {
    console.error('Error updating savings fund:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to update savings fund. ${errorMessage}` };
  }
}

export async function deleteSavingsFund(id: string, userId: string, translations: Translations, paymentMethodId?: string): Promise<{ success: boolean; error?: string }> {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid savings fund ID.' };
    }
    if (!userId) return { success: false, error: 'User not authenticated.' };
    try {
      const { savingsFundsCollection, transactionsCollection, categoriesCollection } = await getDb();
      
      const fundToDelete = await getSavingsFundById(id, userId);
      if (!fundToDelete) {
        return { success: false, error: 'Savings fund not found or you do not have permission to delete it.' };
      }

      // If fund has a balance, transfer it back to the main account before deleting.
      if (fundToDelete.currentAmount > 0) {
        if (!paymentMethodId) {
          return { success: false, error: translations.paymentMethodRequired };
        }
        const transferCategory = await categoriesCollection.findOne({ userId, name: "Savings" });
        if (!transferCategory) throw new Error(translations.deleteFundErrorTransferCategory);
        
        await addTransaction({
          amount: fundToDelete.currentAmount,
          categoryId: transferCategory._id.toString(),
          date: new Date(),
          description: translations.deleteFundDescription.replace('{fundName}', fundToDelete.name),
          paymentMethodId: paymentMethodId,
          type: 'income',
          // No savingsFundId, so it's a main balance transaction
        }, userId);
      }
      
      // Delete all transactions associated with this fund
      await transactionsCollection.deleteMany({ userId, savingsFundId: id });
  
      const result = await savingsFundsCollection.deleteOne({ _id: new ObjectId(id), userId });
      
      if (result.deletedCount === 0) {
        // This case should ideally not be reached if getSavingsFundById check passes, but it's a safeguard.
        return { success: false, error: 'Savings fund not found or you do not have permission to delete it.' };
      }
  
      revalidateTag(`savingsFunds_${userId}`);
      revalidateTag(`transactions_${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting savings fund:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `${errorMessage}` };
    }
}

export async function transferToFund(
    values: { amount: number; description: string; paymentMethodId: string; categoryId: string; fundId: string; date: Date },
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };

    try {
        // Create expense from main balance
        await addTransaction({
            amount: values.amount,
            categoryId: values.categoryId,
            date: values.date,
            description: values.description,
            paymentMethodId: values.paymentMethodId,
            type: 'expense',
            // No savingsFundId, so it affects main balance
        }, userId);

        // Create income in savings fund
        await addTransaction({
            amount: values.amount,
            categoryId: values.categoryId,
            date: values.date,
            description: values.description,
            paymentMethodId: values.paymentMethodId,
            type: 'income',
            savingsFundId: values.fundId,
        }, userId);

        revalidateTag(`savingsFunds_${userId}`);
        revalidateTag(`transactions_${userId}`);
        return { success: true };

    } catch (error) {
        console.error('Error transferring to fund:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to transfer to fund. ${errorMessage}` };
    }
}

export async function withdrawFromFund(
    values: { amount: number; description: string; paymentMethodId: string; categoryId: string; fundId: string; date: Date },
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    try {
        // Create expense from savings fund
        await addTransaction({
            amount: values.amount,
            categoryId: values.categoryId,
            date: values.date,
            description: values.description,
            paymentMethodId: values.paymentMethodId,
            type: 'expense',
            savingsFundId: values.fundId,
        }, userId);
        
        // Create income in main balance
        await addTransaction({
            amount: values.amount,
            categoryId: values.categoryId,
            date: values.date,
            description: values.description,
            paymentMethodId: values.paymentMethodId,
            type: 'income',
            // No savingsFundId, so it affects main balance
        }, userId);

        revalidateTag(`savingsFunds_${userId}`);
        revalidateTag(`transactions_${userId}`);
        return { success: true };

    } catch (error) {
        console.error('Error withdrawing from fund:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to withdraw from fund. ${errorMessage}` };
    }
}

    