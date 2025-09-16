'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocument, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import type { Transaction, TransactionFormValues, InstallmentDetail, PaymentMethod, CompletedInstallmentDetail } from '@/types';
import { addMonths, isFuture, isSameMonth, startOfMonth, endOfMonth, isWithinInterval, format, startOfYear, endOfYear, getYear, isPast } from 'date-fns';

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

async function getPaymentMethodsForInstallments(userId: string): Promise<PaymentMethod[]> {
  if (!userId) return [];
  try {
    const { paymentMethodsCollection } = await getDb();
    const methods = await paymentMethodsCollection.find({ userId }).sort({ name: 1 }).toArray();
    return methods.map(mapMongoDocumentPaymentMethod);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

export async function getInstallmentDetails(userId: string): Promise<{ pendingDetails: InstallmentDetail[], completedDetails: CompletedInstallmentDetail[], totalPending: number, totalForCurrentMonth: number }> {
    if (!userId) return { pendingDetails: [], completedDetails: [], totalPending: 0, totalForCurrentMonth: 0 };
  
  try {
    const { transactionsCollection } = await getDb();
    const paymentMethods = await getPaymentMethodsForInstallments(userId);
    const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]));

    const installmentTransactions = await transactionsCollection.find({
      userId,
      type: 'expense',
      description: { $regex: "\\(Cuota \\d+\\/\\d+\\)" }
    }).sort({ date: 1 }).toArray();

    if (installmentTransactions.length === 0) {
      return { pendingDetails: [], completedDetails: [], totalPending: 0, totalForCurrentMonth: 0 };
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
    
    const pendingDetails: InstallmentDetail[] = [];
    const completedDetails: CompletedInstallmentDetail[] = [];
    let totalPending = 0;
    let totalForCurrentMonth = 0;
    const now = new Date();
    const currentMonthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

    groupedInstallments.forEach((group) => {
      const firstInstallment = group[0];
      const lastInstallment = group[group.length - 1];
      const totalInstallments = group.length;
      const purchaseAmount = group.reduce((sum, item) => sum + item.amount, 0);
      const baseDescription = firstInstallment.description.match(installmentRegex)![1].trim();
      const paymentMethod = paymentMethodMap.get(firstInstallment.paymentMethodId);
      const paymentMethodName = paymentMethod ? `${paymentMethod.name} ${paymentMethod.bank ? `(${paymentMethod.bank})` : ''}`.trim() : 'Unknown';

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

        pendingDetails.push({
          id: firstInstallment.id,
          description: baseDescription,
          totalAmount: purchaseAmount,
          installmentAmount: firstInstallment.amount,
          currentInstallment: totalInstallments - pendingInstallments.length + 1,
          totalInstallments: totalInstallments,
          pendingAmount: pendingAmount,
          paymentMethodName: paymentMethodName,
          purchaseDate: firstInstallment.date,
          lastInstallmentDate: lastInstallment.date,
        });
      } else {
        // All installments are in the past, so it's completed
        if (isPast(new Date(lastInstallment.date))) {
          completedDetails.push({
            id: firstInstallment.id,
            description: baseDescription,
            totalAmount: purchaseAmount,
            totalInstallments: totalInstallments,
            paymentMethodName: paymentMethodName,
            purchaseDate: firstInstallment.date,
            lastInstallmentDate: lastInstallment.date,
          });
        }
      }
    });

    return { 
      pendingDetails: pendingDetails.sort((a,b) => b.pendingAmount - a.pendingAmount), 
      completedDetails: completedDetails.sort((a, b) => new Date(b.lastInstallmentDate).getTime() - new Date(a.lastInstallmentDate).getTime()),
      totalPending, 
      totalForCurrentMonth 
    };

  } catch (error) {
    console.error('Error fetching installment details:', error);
    return { pendingDetails: [], completedDetails: [], totalPending: 0, totalForCurrentMonth: 0 };
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
          description: { $regex: "\\(Cuota \\d+\\/\\d+\\)" },
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
