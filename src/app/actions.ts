'use server';

import { revalidateTag } from 'next/cache';
import { MongoClient, ObjectId, type WithId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Transaction, TransactionFormValues, Tax, TaxFormValues } from '@/types';

// Helper function to get the database and collection
async function getDb() {
  const client: MongoClient = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'ledger_lite');
  return { 
    db, 
    transactionsCollection: db.collection('transactions'),
    taxesCollection: db.collection('taxes'),
  };
}

// Map MongoDB's _id and other fields to a serializable Transaction object
function mapMongoDocument(doc: WithId<Document>): Transaction {
  const { _id, date, ...rest } = doc;
  return { 
    id: _id.toString(),
    date: new Date(date), // Ensure date is a Date object on the server
    ...rest 
  } as Transaction;
}

function mapMongoDocumentTax(doc: WithId<Document>): Tax {
  const { _id, date, ...rest } = doc;
  return {
    id: _id.toString(),
    date: new Date(date),
    ...rest
  } as Tax;
}


export async function getTransactions(userId: string): Promise<Transaction[]> {
  if (!userId) return [];
  try {
    const { transactionsCollection } = await getDb();
    const transactions = await transactionsCollection.find({ userId }).sort({ date: -1 }).toArray();
    return transactions.map(mapMongoDocument);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function addTransaction(data: TransactionFormValues, userId: string): Promise<Transaction | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { transactionsCollection } = await getDb();
    // MongoDB driver expects a Date object for date fields
    const documentToInsert = { ...data, date: new Date(data.date), userId };
    const result = await transactionsCollection.insertOne(documentToInsert);
    
    if (!result.insertedId) {
        throw new Error('Failed to insert transaction.');
    }

    revalidateTag(`transactions_${userId}`);
    const newTransaction = await transactionsCollection.findOne({ _id: result.insertedId });
    if (!newTransaction) {
        throw new Error('Could not find the newly created transaction.');
    }
    return mapMongoDocument(newTransaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to add transaction. ${errorMessage}` };
  }
}

export async function updateTransaction(id: string, data: TransactionFormValues, userId: string): Promise<Transaction | { error: string }> {
  if (!ObjectId.isValid(id)) {
    return { error: 'Invalid transaction ID.' };
  }
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { transactionsCollection } = await getDb();
    const documentToUpdate = { ...data, date: new Date(data.date) };
    const result = await transactionsCollection.updateOne(
      { _id: new ObjectId(id), userId }, // Ensure user owns the doc
      { $set: documentToUpdate }
    );
    
    if (result.matchedCount === 0) {
        return { error: 'Transaction not found or you do not have permission to edit it.' };
    }

    revalidateTag(`transactions_${userId}`);
    const updatedTransaction = await transactionsCollection.findOne({ _id: new ObjectId(id) });
     if (!updatedTransaction) {
        throw new Error('Could not find the updated transaction.');
    }
    return mapMongoDocument(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to update transaction. ${errorMessage}` };
  }
}

export async function deleteTransaction(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) {
    return { success: false, error: 'Invalid transaction ID.' };
  }
  if (!userId) return { success: false, error: 'User not authenticated.' };
  try {
    const { transactionsCollection } = await getDb();
    const result = await transactionsCollection.deleteOne({ _id: new ObjectId(id), userId }); // Ensure user owns the doc
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Transaction not found or you do not have permission to delete it.' };
    }

    revalidateTag(`transactions_${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete transaction. ${errorMessage}` };
  }
}

// Tax actions
export async function getTaxes(userId: string): Promise<Tax[]> {
  if (!userId) return [];
  try {
    const { taxesCollection } = await getDb();
    const taxes = await taxesCollection.find({ userId }).sort({ date: -1 }).toArray();
    return taxes.map(mapMongoDocumentTax);
  } catch (error) {
    console.error('Error fetching taxes:', error);
    return [];
  }
}

export async function addTax(data: TaxFormValues, userId: string): Promise<Tax | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { taxesCollection } = await getDb();
    const documentToInsert = { ...data, date: new Date(), userId }; // date is for sorting
    const result = await taxesCollection.insertOne(documentToInsert);
    
    if (!result.insertedId) {
        throw new Error('Failed to insert tax record.');
    }

    revalidateTag(`taxes_${userId}`);
    const newTax = await taxesCollection.findOne({ _id: result.insertedId });
    if (!newTax) {
        throw new Error('Could not find the newly created tax record.');
    }
    return mapMongoDocumentTax(newTax);
  } catch (error) {
    console.error('Error adding tax record:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to add tax record. ${errorMessage}` };
  }
}
