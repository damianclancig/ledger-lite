
'use server';

import { revalidateTag } from 'next/cache';
import { MongoClient, ObjectId, type WithId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Transaction, TransactionFormValues, Tax, TaxFormValues, Category, CategoryFormValues, PaymentMethod, PaymentMethodFormValues, InstallmentDetail } from '@/types';
import { CATEGORIES, PAYMENT_METHOD_TYPES } from "@/types";
import { addMonths, isFuture, isSameMonth, startOfMonth, endOfMonth, isWithinInterval, format, startOfYear, endOfYear, getYear } from 'date-fns';


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
    const { installments, ...transactionData } = data;

    if (installments && installments > 1) {
      const installmentAmount = transactionData.amount / installments;
      const originalDate = new Date(transactionData.date);
      const transactionsToInsert = [];

      for (let i = 0; i < installments; i++) {
        transactionsToInsert.push({
          ...transactionData,
          amount: installmentAmount,
          date: addMonths(originalDate, i),
          description: `${transactionData.description} (Cuota ${i + 1}/${installments})`,
          userId,
        });
      }
      await transactionsCollection.insertMany(transactionsToInsert);
    } else {
      const documentToInsert = { ...transactionData, date: new Date(transactionData.date), userId };
      await transactionsCollection.insertOne(documentToInsert);
    }
    
    revalidateTag(`transactions_${userId}`);
    revalidateTag(`taxes_${userId}`);

    // For simplicity, we'll just return a success-like object.
    // Returning the first created transaction in an installment scenario.
    const firstTransaction = await transactionsCollection.findOne({ userId, description: installments && installments > 1 ? `${transactionData.description} (Cuota 1/${installments})` : transactionData.description }, { sort: { date: 1 } });
    
    if (!firstTransaction) {
      throw new Error('Could not find the newly created transaction.');
    }
    return mapMongoDocument(firstTransaction);

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
    // Installment logic is not applied on update for simplicity
    const { installments, ...transactionData } = data;
    const documentToUpdate = { ...transactionData, date: new Date(transactionData.date) };

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

export async function getPaymentMethodById(id: string, userId: string): Promise<PaymentMethod | null> {
  if (!ObjectId.isValid(id) || !userId) {
    return null;
  }
  try {
    const { paymentMethodsCollection } = await getDb();
    const paymentMethod = await paymentMethodsCollection.findOne({ _id: new ObjectId(id), userId });
    return paymentMethod ? mapMongoDocumentPaymentMethod(paymentMethod) : null;
  } catch (error) {
    console.error('Error fetching payment method by ID:', error);
    return null;
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


export async function getInstallmentDetails(userId: string): Promise<{ details: InstallmentDetail[], totalPending: number, totalForCurrentMonth: number }> {
  if (!userId) return { details: [], totalPending: 0, totalForCurrentMonth: 0 };
  
  try {
    const { transactionsCollection } = await getDb();
    const paymentMethods = await getPaymentMethods(userId);
    const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]));

    const installmentTransactions = await transactionsCollection.find({
      userId,
      type: 'expense',
      description: { $regex: /\(Cuota \d+\/\d+\)/ }
    }).sort({ date: 1 }).toArray();

    if (installmentTransactions.length === 0) {
      return { details: [], totalPending: 0, totalForCurrentMonth: 0 };
    }

    const groupedInstallments = new Map<string, Transaction[]>();

    const installmentRegex = /^(.*) \(Cuota \d+\/\d+\)$/;

    for (const trans of installmentTransactions) {
      const match = trans.description.match(installmentRegex);
      if (match) {
        const baseDescription = match[1].trim();
        const key = `${baseDescription}-${trans.paymentMethodId}`;
        
        if (!groupedInstallments.has(key)) {
          groupedInstallments.set(key, []);
        }
        groupedInstallments.get(key)!.push(mapMongoDocument(trans));
      }
    }
    
    const details: InstallmentDetail[] = [];
    let totalPending = 0;
    let totalForCurrentMonth = 0;
    const now = new Date();
    const currentMonthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

    groupedInstallments.forEach((group) => {
      const firstInstallment = group[0];
      const totalInstallments = group.length;
      const purchaseAmount = group.reduce((sum, item) => sum + item.amount, 0);

      const pendingInstallments = group.filter(item => {
        const itemDate = new Date(item.date);
        return isFuture(itemDate) || isSameMonth(itemDate, now);
      });
      
      if (pendingInstallments.length > 0) {
        const pendingAmount = pendingInstallments.reduce((sum, item) => sum + item.amount, 0);
        totalPending += pendingAmount;
        
        const currentMonthInstallment = pendingInstallments.find(item => isWithinInterval(new Date(item.date), currentMonthInterval));
        if (currentMonthInstallment) {
          totalForCurrentMonth += currentMonthInstallment.amount;
        }

        const paymentMethod = paymentMethodMap.get(firstInstallment.paymentMethodId);

        details.push({
          id: firstInstallment.id,
          description: firstInstallment.description.match(installmentRegex)![1].trim(),
          totalAmount: purchaseAmount,
          installmentAmount: firstInstallment.amount,
          currentInstallment: totalInstallments - pendingInstallments.length + 1,
          totalInstallments: totalInstallments,
          pendingAmount: pendingAmount,
          paymentMethodName: paymentMethod ? `${paymentMethod.name} (${paymentMethod.bank || 'N/A'})` : 'Unknown',
        });
      }
    });

    return { details: details.sort((a,b) => b.pendingAmount - a.pendingAmount), totalPending, totalForCurrentMonth };

  } catch (error) {
    console.error('Error fetching installment details:', error);
    return { details: [], totalPending: 0, totalForCurrentMonth: 0 };
  }
}

export async function getInstallmentProjection(userId: string): Promise<{ month: string; total: number }[]> {
  if (!userId) return [];
  try {
    const { transactionsCollection } = await getDb();
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const pipeline = [
      {
        $match: {
          userId: userId,
          type: 'expense',
          description: { $regex: /\(Cuota \d+\/\d+\)/ },
          date: {
            $gte: yearStart,
            $lte: yearEnd
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          total: "$total"
        }
      }
    ];

    const result = await transactionsCollection.aggregate(pipeline).toArray() as { month: string; total: number }[];

    const projectionMap = new Map(result.map(item => [item.month, item.total]));
    const finalProjection = [];
    const currentYear = getYear(now);

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, i, 1);
      const monthKey = format(monthDate, 'yyyy-MM');
      finalProjection.push({
        month: monthKey,
        total: projectionMap.get(monthKey) || 0
      });
    }

    return finalProjection;
    
  } catch (error) {
    console.error('Error fetching installment projection:', error);
    return [];
  }
}
    

    
