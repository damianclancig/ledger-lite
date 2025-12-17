'use server';

import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/actions-helpers';
import { handleActionError } from '@/lib/error-helpers';
import { revalidateUserTags, CacheTag } from '@/lib/cache-helpers';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { parseInstallmentDescription, formatInstallmentDescription } from '@/lib/installment-helpers';
import type { Transaction, TransactionFormValues } from '@/types';
import { addMonths } from 'date-fns';
import { getCurrentBillingCycle } from '../billingCycleActions';

export async function getInstallmentPurchaseByGroupId(groupId: string): Promise<Partial<Transaction> | null> {
  const { id: userId } = await getAuthenticatedUser();
  if (!groupId || !userId) {
    return null;
  }
  try {
    const { transactionsCollection } = await getDb();
    const groupTransactions = await transactionsCollection.find({ userId, groupId }).toArray();

    if (groupTransactions.length === 0) {
      return null;
    }

    groupTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstInstallment = groupTransactions[0];
    const totalAmount = groupTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalInstallments = groupTransactions.length;

    // Use installment helper to parse description
    const parsed = parseInstallmentDescription(firstInstallment.description);
    const baseDescription = parsed ? parsed.baseDescription : firstInstallment.description;

    return {
      id: firstInstallment._id.toString(),
      groupId,
      description: baseDescription,
      amount: totalAmount,
      date: new Date(firstInstallment.date).toISOString(),
      categoryId: firstInstallment.categoryId,
      type: 'expense',
      paymentMethodId: firstInstallment.paymentMethodId,
      installments: totalInstallments,
    };
  } catch (error) {
    console.error('Error fetching installment purchase by group ID:', error);
    return null;
  }
}

export async function updateInstallmentPurchase(groupId: string, data: TransactionFormValues): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: userId } = await getAuthenticatedUser();
    if (!groupId) {
      return { success: false, error: 'Invalid group ID.' };
    }

    const { transactionsCollection } = await getDb();

    await transactionsCollection.deleteMany({ userId, groupId });

    const { installments, ...transactionData } = data;
    const currentCycle = await getCurrentBillingCycle();
    const baseTransaction = {
      ...transactionData,
      userId,
      billingCycleId: currentCycle?.id,
    };

    if (installments && installments > 1) {
      const installmentAmount = baseTransaction.amount / installments;
      const originalDate = new Date(baseTransaction.date);
      const transactionsToInsert = [];
      const newGroupId = new ObjectId(groupId);

      for (let i = 0; i < installments; i++) {
        transactionsToInsert.push({
          ...baseTransaction,
          amount: installmentAmount,
          date: addMonths(originalDate, i),
          description: formatInstallmentDescription(baseTransaction.description, i + 1, installments),
          groupId: newGroupId.toString(),
        });
      }
      await transactionsCollection.insertMany(transactionsToInsert);
    } else {
      await transactionsCollection.insertOne({
        ...baseTransaction,
        date: new Date(baseTransaction.date),
      });
    }

    revalidateUserTags(userId, [CacheTag.TRANSACTIONS, CacheTag.INSTALLMENT_DETAILS]);
    return { success: true };

  } catch (error) {
    return { success: false, ...handleActionError(error, 'update installment purchase') };
  }
}
