
'use server';

import { revalidateTag } from 'next/cache';
import { MongoClient, ObjectId, type WithId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Transaction, TransactionFormValues, Tax, TaxFormValues, Category, CategoryFormValues, PaymentMethod, PaymentMethodFormValues } from '@/types';
import { CATEGORIES, PAYMENT_METHOD_TYPES } from "@/types";


// Helper function to get the database and collection
async function getDb() {
  const client: MongoClient = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'ledger_lite');
  return { 
    db, 
    transactionsCollection: db.collection('transactions'),
    taxesCollection: db.collection('taxes'),
    categoriesCollection: db.collection('categories'),
    paymentMethodsCollection: db.collection('paymentMethods'),
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

function mapMongoDocumentCategory(doc: WithId<Document>): Category {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  } as Category;
}

function mapMongoDocumentPaymentMethod(doc: WithId<Document>): PaymentMethod {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  } as PaymentMethod;
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

export async function getTransactionById(id: string, userId: string): Promise<Transaction | null> {
  if (!ObjectId.isValid(id) || !userId) {
    return null;
  }
  try {
    const { transactionsCollection } = await getDb();
    const transaction = await transactionsCollection.findOne({ _id: new ObjectId(id), userId });
    return transaction ? mapMongoDocument(transaction) : null;
  } catch (error) {
    console.error('Error fetching transaction by ID:', error);
    return null;
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
    revalidateTag(`taxes_${userId}`); // Invalidate taxes too in case a tax was paid
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
    const documentToInsert = { ...data, date: new Date(), userId, isPaid: false };
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

export async function markTaxAsPaid(taxId: string, transactionId: string, userId: string): Promise<{ success: boolean, error?: string }> {
  if (!ObjectId.isValid(taxId)) {
    return { success: false, error: 'Invalid tax ID.' };
  }
  if (!userId) return { success: false, error: 'User not authenticated.' };

  try {
    const { taxesCollection } = await getDb();
    const result = await taxesCollection.updateOne(
      { _id: new ObjectId(taxId), userId },
      { $set: { isPaid: true, transactionId: transactionId } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Tax record not found or user mismatch.' };
    }

    revalidateTag(`taxes_${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error marking tax as paid:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update tax record. ${errorMessage}` };
  }
}

// Category actions
async function seedDefaultCategories(userId: string) {
  const { categoriesCollection } = await getDb();
  const defaultCategories = CATEGORIES.map(name => ({
    name,
    userId,
    isEnabled: true,
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
    }

    const categories = await categoriesCollection.find({ userId }).sort({ name: 1 }).toArray();
    return categories.map(mapMongoDocumentCategory);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function addCategory(data: CategoryFormValues, userId: string): Promise<Category | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { categoriesCollection } = await getDb();
    const documentToInsert = { ...data, userId };
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

// Payment Method Actions
async function seedDefaultPaymentMethods(userId: string) {
  const { paymentMethodsCollection } = await getDb();
  const defaultMethods = [
    { name: 'Cash', type: 'Cash', isEnabled: true, userId },
    { name: 'Main Credit Card', type: 'Credit Card', isEnabled: true, userId },
    { name: 'Main Debit Card', type: 'Debit Card', isEnabled: true, userId },
  ];
  await paymentMethodsCollection.insertMany(defaultMethods);
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  if (!userId) return [];
  try {
    const { paymentMethodsCollection } = await getDb();
    const userMethodsCount = await paymentMethodsCollection.countDocuments({ userId });

    if (userMethodsCount === 0) {
      await seedDefaultPaymentMethods(userId);
    }

    const methods = await paymentMethodsCollection.find({ userId }).sort({ name: 1 }).toArray();
    return methods.map(mapMongoDocumentPaymentMethod);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

export async function addPaymentMethod(data: PaymentMethodFormValues, userId: string): Promise<PaymentMethod | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { paymentMethodsCollection } = await getDb();
    const documentToInsert = { ...data, userId };
    const result = await paymentMethodsCollection.insertOne(documentToInsert);
    
    if (!result.insertedId) {
      throw new Error('Failed to insert payment method.');
    }

    revalidateTag(`paymentMethods_${userId}`);
    const newMethod = await paymentMethodsCollection.findOne({ _id: result.insertedId });
    if (!newMethod) {
      throw new Error('Could not find the newly created payment method.');
    }
    return mapMongoDocumentPaymentMethod(newMethod);
  } catch (error) {
    console.error('Error adding payment method:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to add payment method. ${errorMessage}` };
  }
}

export async function updatePaymentMethod(id: string, data: PaymentMethodFormValues, userId: string): Promise<PaymentMethod | { error: string }> {
  if (!ObjectId.isValid(id)) {
    return { error: 'Invalid payment method ID.' };
  }
  if (!userId) return { error: 'User not authenticated.' };
  try {
    const { paymentMethodsCollection } = await getDb();

    const result = await paymentMethodsCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return { error: 'Payment method not found or you do not have permission to edit it.' };
    }

    revalidateTag(`paymentMethods_${userId}`);
    const updatedMethod = await paymentMethodsCollection.findOne({ _id: new ObjectId(id) });
    if (!updatedMethod) {
      throw new Error('Could not find the updated payment method.');
    }
    return mapMongoDocumentPaymentMethod(updatedMethod);
  } catch (error) {
    console.error('Error updating payment method:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to update payment method. ${errorMessage}` };
  }
}
