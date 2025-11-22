'use server';

import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocument, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import { validateUserId, validateUserAndId } from '@/lib/validation-helpers';
import { handleActionError } from '@/lib/error-helpers';
import { revalidateUserTags, TagGroups } from '@/lib/cache-helpers';
import { formatInstallmentDescription } from '@/lib/installment-helpers';
import type { Transaction, TransactionFormValues, BillingCycle } from '@/types';
import { addMonths, endOfMonth } from 'date-fns';
import { getCurrentBillingCycle } from '../billingCycleActions';

export interface GetTransactionsOptions {
  cycle?: BillingCycle | null;
  limit?: number;
}

export async function getTransactions(userId: string, options: GetTransactionsOptions = {}): Promise<Transaction[]> {
  if (!userId) return [];
  try {
    const { transactionsCollection } = await getDb();

    const query: any = { userId };

    if (options.cycle && options.cycle.id !== 'all') {
      const cycleEndDate = options.cycle.endDate
        ? new Date(options.cycle.endDate)
        : endOfMonth(new Date());

      query.date = {
        $gte: new Date(options.cycle.startDate),
        $lte: cycleEndDate,
      };
    }


    let cursor = transactionsCollection.find(query).sort({ date: -1 });

    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }

    const transactions = await cursor.toArray();
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
  try {
    validateUserId(userId);
    const { transactionsCollection, paymentMethodsCollection } = await getDb();
    const { installments, ...transactionData } = data;
    const currentCycle = await getCurrentBillingCycle(userId);
    const paymentMethodDoc = await paymentMethodsCollection.findOne({ _id: new ObjectId(data.paymentMethodId), userId });
    const paymentMethod = paymentMethodDoc ? mapMongoDocumentPaymentMethod(paymentMethodDoc) : null;
    const isCardPayment = data.type === 'expense' && paymentMethod?.type === 'Credit Card';

    const baseTransaction = {
      ...transactionData,
      date: new Date(transactionData.date),
      userId,
      isCardPayment,
      isPaid: !isCardPayment,
      cardId: isCardPayment ? data.paymentMethodId : undefined,
    };

    if (installments && installments > 1 && isCardPayment) {
      const installmentAmount = baseTransaction.amount / installments;
      const originalDate = new Date(baseTransaction.date);
      const transactionsToInsert = [];
      const groupId = new ObjectId();

      for (let i = 0; i < installments; i++) {
        transactionsToInsert.push({
          ...baseTransaction,
          amount: installmentAmount,
          date: addMonths(originalDate, i),
          description: formatInstallmentDescription(baseTransaction.description, i + 1, installments),
          groupId: groupId.toString(),
        });
      }
      await transactionsCollection.insertMany(transactionsToInsert);
    } else {
      await transactionsCollection.insertOne(baseTransaction);
    }

    revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);

    const firstTransaction = await transactionsCollection.findOne({ 
      userId, 
      description: installments && installments > 1 
        ? formatInstallmentDescription(transactionData.description, 1, installments)
        : transactionData.description 
    }, { sort: { date: 1 } });

    if (!firstTransaction) {
      throw new Error('Could not find the newly created transaction.');
    }
    return mapMongoDocument(firstTransaction);

  } catch (error) {
    return handleActionError(error, 'add transaction');
  }
}

export async function updateTransaction(id: string, data: TransactionFormValues, userId: string): Promise<Transaction | { error: string }> {
  try {
    validateUserAndId(userId, id, 'transaction ID');
    const { transactionsCollection } = await getDb();
    
    const documentToUpdate = { 
        ...data, 
        date: new Date(data.date),
    };

    const result = await transactionsCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: documentToUpdate }
    );
    
    if (result.matchedCount === 0) {
      return { error: 'Transaction not found or you do not have permission to edit it.' };
    }

    revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);
    
    const updatedTransaction = await transactionsCollection.findOne({ _id: new ObjectId(id) });
    if (!updatedTransaction) {
      throw new Error('Could not find the updated transaction.');
    }
    return mapMongoDocument(updatedTransaction);
  } catch (error) {
    return handleActionError(error, 'update transaction');
  }
}

export async function deleteTransaction(id: string, userId: string): Promise<{ success: boolean; error?: string; deletedGroupId?: string }> {
  try {
    validateUserAndId(userId, id, 'transaction ID');
    const { transactionsCollection } = await getDb();

    const transactionToDelete = await transactionsCollection.findOne({ _id: new ObjectId(id), userId });
    if (!transactionToDelete) {
      return { success: false, error: 'Transaction not found or you do not have permission to delete it.' };
    }

    const groupId = transactionToDelete.groupId;

    if (groupId) {
      const result = await transactionsCollection.deleteMany({ userId, groupId });
      if (result.deletedCount === 0) {
        return { success: false, error: 'Failed to delete transactions.' };
      }
      revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);
      return { success: true, deletedGroupId: groupId };
    } else {
      const result = await transactionsCollection.deleteOne({ _id: new ObjectId(id), userId });
      if (result.deletedCount === 0) {
        return { success: false, error: 'Transaction not found during deletion.' };
      }
      revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);
      return { success: true };
    }
  } catch (error) {
    return { success: false, ...handleActionError(error, 'delete transaction') };
  }
}

export async function markTaxAsPaid(taxId: string, transactionId: string, userId: string): Promise<{ success: boolean, error?: string }> {
  try {
    validateUserId(userId);
    const { taxesCollection, transactionsCollection } = await getDb();

    const tax = await taxesCollection.findOne({ _id: new ObjectId(taxId), userId });
    if (!tax) {
      return { success: false, error: 'Tax not found.' };
    }

    const transaction = await transactionsCollection.findOne({ _id: new ObjectId(transactionId), userId });
    if (!transaction) {
      return { success: false, error: 'Transaction not found.' };
    }

    await taxesCollection.updateOne(
      { _id: new ObjectId(taxId) },
      { $set: { isPaid: true, paidTransactionId: transactionId } }
    );

    revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);
    return { success: true };
  } catch (error) {
    return { success: false, ...handleActionError(error, 'mark tax as paid') };
  }
}
