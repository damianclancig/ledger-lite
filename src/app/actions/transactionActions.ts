
'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocument, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import type { Transaction, TransactionFormValues, InstallmentDetail, PaymentMethod, CompletedInstallmentDetail, BillingCycle, InstallmentProjection } from '@/types';
import { addMonths, isFuture, isSameMonth, startOfMonth, endOfMonth, format, startOfYear, endOfYear, getYear, isPast } from 'date-fns';
import { getCurrentBillingCycle } from './billingCycleActions';

interface GetTransactionsOptions {
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

export async function getInstallmentProjections(userId: string): Promise<InstallmentProjection[]> {
  if (!userId) return [];
  try {
    const { transactionsCollection } = await getDb();
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const query = {
      userId,
      type: 'expense',
      groupId: { $exists: true },
      date: {
        $gte: yearStart,
        $lte: yearEnd
      }
    };

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", total: "$total" } }
    ];

    const result = await transactionsCollection.aggregate(pipeline).toArray() as unknown as InstallmentProjection[];

    const projectionMap = new Map(result.map((item: any) => [item.month, item.total]));
    const finalProjection: InstallmentProjection[] = [];
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
    console.error('Error fetching installment projections:', error);
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
          description: `${baseTransaction.description} (${i + 1}/${installments})`,
          groupId: groupId.toString(),
        });
      }
      await transactionsCollection.insertMany(transactionsToInsert);
    } else {
      await transactionsCollection.insertOne(baseTransaction);
    }

    revalidateTag(`transactions_${userId}`);
    revalidateTag(`taxes_${userId}`);
    revalidateTag(`savingsFunds_${userId}`);
    revalidateTag(`cardSummaries_${userId}`);

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
    const { installments, ...transactionData } = data;

    const documentToUpdate: any = { ...transactionData, date: new Date(transactionData.date) };

    const result = await transactionsCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: documentToUpdate }
    );

    if (result.matchedCount === 0) {
      return { error: 'Transaction not found or you do not have permission to edit it.' };
    }

    revalidateTag(`transactions_${userId}`);
    revalidateTag(`savingsFunds_${userId}`);
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

export async function deleteTransaction(id: string, userId: string): Promise<{ success: boolean; error?: string; deletedGroupId?: string }> {
  if (!ObjectId.isValid(id)) {
    return { success: false, error: 'Invalid transaction ID.' };
  }
  if (!userId) return { success: false, error: 'User not authenticated.' };

  try {
    const { transactionsCollection } = await getDb();
    const transactionToDelete = await transactionsCollection.findOne({ _id: new ObjectId(id), userId });

    if (!transactionToDelete) {
      return { success: false, error: 'Transaction not found or you do not have permission to delete it.' };
    }

    let deletedGroupId: string | undefined = undefined;

    if (transactionToDelete.groupId) {
      deletedGroupId = transactionToDelete.groupId;
      await transactionsCollection.deleteMany({ userId, groupId: transactionToDelete.groupId });
    } else {
      await transactionsCollection.deleteOne({ _id: new ObjectId(id), userId });
    }

    revalidateTag(`transactions_${userId}`);
    revalidateTag(`savingsFunds_${userId}`);
    revalidateTag(`cardSummaries_${userId}`);
    return { success: true, deletedGroupId };
  } catch (error) {
    console.error('Error deleting transaction(s):', error);
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
      groupId: { $exists: true }
    }).sort({ date: 1 }).toArray();

    if (installmentTransactions.length === 0) {
      return { pendingDetails: [], completedDetails: [], totalPending: 0, totalForCurrentMonth: 0 };
    }

    const groupedInstallments = new Map<string, Transaction[]>();

    for (const trans of installmentTransactions) {
      const key = trans.groupId;
      if (!groupedInstallments.has(key)) {
        groupedInstallments.set(key, []);
      }
      groupedInstallments.get(key)!.push(mapMongoDocument(trans));
    }

    const pendingDetails: InstallmentDetail[] = [];
    const completedDetails: CompletedInstallmentDetail[] = [];
    let totalPending = 0;
    let totalForCurrentMonth = 0;
    const now = new Date();

    const installmentRegex = /^(.*) \(\d+\/\d+\)$/;

    groupedInstallments.forEach((group) => {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstInstallment = group[0];
      const lastInstallment = group[group.length - 1];
      const totalInstallments = group.length;
      const purchaseAmount = group.reduce((sum, item) => sum + item.amount, 0);
      const baseDescriptionMatch = firstInstallment.description.match(installmentRegex);
      const baseDescription = baseDescriptionMatch ? baseDescriptionMatch[1].trim() : firstInstallment.description;
      const paymentMethod = paymentMethodMap.get(firstInstallment.paymentMethodId);
      const paymentMethodName = paymentMethod ? `${paymentMethod.name} ${paymentMethod.bank ? `(${paymentMethod.bank})` : ''}`.trim() : 'Unknown';

      const pendingInstallments = group.filter(item => {
        const itemDate = new Date(item.date);
        return isFuture(itemDate) || isSameMonth(itemDate, now);
      });

      if (pendingInstallments.length > 0) {
        const pendingAmount = pendingInstallments.reduce((sum, item) => sum + item.amount, 0);
        totalPending += pendingAmount;

        const currentMonthInstallment = pendingInstallments.find(item => isSameMonth(new Date(item.date), now));
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
      pendingDetails: pendingDetails.sort((a, b) => b.pendingAmount - a.pendingAmount),
      completedDetails: completedDetails.sort((a, b) => new Date(b.lastInstallmentDate).getTime() - new Date(a.lastInstallmentDate).getTime()),
      totalPending,
      totalForCurrentMonth
    };

  } catch (error) {
    console.error('Error fetching installment details:', error);
    return { pendingDetails: [], completedDetails: [], totalPending: 0, totalForCurrentMonth: 0 };
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

export async function getInstallmentPurchaseByGroupId(groupId: string, userId: string): Promise<Partial<Transaction> | null> {
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
    const installmentRegex = /^(.*) \(Cuota \d+\/\d+\)$/;
    const baseDescriptionMatch = firstInstallment.description.match(installmentRegex);
    const baseDescription = baseDescriptionMatch ? baseDescriptionMatch[1].trim() : firstInstallment.description;

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

export async function updateInstallmentPurchase(groupId: string, data: TransactionFormValues, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!groupId || !userId) {
    return { success: false, error: 'Invalid data for update.' };
  }
  try {
    const { transactionsCollection } = await getDb();

    await transactionsCollection.deleteMany({ userId, groupId });

    const { installments, ...transactionData } = data;
    const currentCycle = await getCurrentBillingCycle(userId);
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
          description: `${baseTransaction.description} (Cuota ${i + 1}/${installments})`,
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

    revalidateTag(`transactions_${userId}`);
    revalidateTag(`installmentDetails_${userId}`);
    return { success: true };

  } catch (error) {
    console.error('Error updating installment purchase:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update purchase. ${errorMessage}` };
  }
}

