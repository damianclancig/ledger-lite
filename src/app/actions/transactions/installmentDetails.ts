'use server';

import { getDb, mapMongoDocument, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import { parseInstallmentDescription } from '@/lib/installment-helpers';
import type { InstallmentDetail, CompletedInstallmentDetail, PaymentMethod, Transaction } from '@/types';
import { isFuture, isSameMonth, isPast } from 'date-fns';

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

    groupedInstallments.forEach((group) => {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstInstallment = group[0];
      const lastInstallment = group[group.length - 1];
      const totalInstallments = group.length;
      const purchaseAmount = group.reduce((sum, item) => sum + item.amount, 0);
      
      // Use installment helper to parse description
      const parsed = parseInstallmentDescription(firstInstallment.description);
      const baseDescription = parsed ? parsed.baseDescription : firstInstallment.description;
      
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
