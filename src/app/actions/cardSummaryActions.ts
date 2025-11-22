'use server';

import { getDb, mapMongoDocument, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import type { CardSummary, PaymentMethod, PaidSummary } from '@/types';
import { ObjectId } from 'mongodb';
import { subMonths, setDate, startOfDay, endOfDay, isAfter } from 'date-fns';
import { validateUserId } from '@/lib/validation-helpers';
import { handleActionError, type ErrorResponse } from '@/lib/error-helpers';
import { revalidateUserTags, CacheTag } from '@/lib/cache-helpers';

export async function getCardSummaries(
  userId: string
): Promise<{ pendingSummaries: CardSummary[], paidSummaries: PaidSummary[] } | ErrorResponse> {
  try {
    validateUserId(userId);
    
    const { transactionsCollection, paymentMethodsCollection } = await getDb();

    const creditCards: PaymentMethod[] = (
      await paymentMethodsCollection.find({ userId, type: 'Credit Card' }).toArray()
    ).map(mapMongoDocumentPaymentMethod);
    
    const pendingSummaries: CardSummary[] = [];
    if (creditCards.length > 0) {
      const now = new Date();

      for (const card of creditCards) {
        let startDate: Date;
        let endDate: Date;

        if (card.closingDay) {
          const closingDay = card.closingDay;
          
          endDate = setDate(now, closingDay);
          endDate = endOfDay(endDate);

          if (isAfter(now, endDate)) {
            startDate = setDate(now, closingDay + 1);
            startDate = startOfDay(startDate);
            endDate = setDate(subMonths(now, -1), closingDay);
            endDate = endOfDay(endDate);
          } else {
            startDate = setDate(subMonths(now, 1), closingDay + 1);
            startDate = startOfDay(startDate);
          }
        } else {
          endDate = now;
          startDate = new Date(0); 
        }
        
        const transactionsForCycle = await transactionsCollection.find({
          userId,
          cardId: card.id,
          isPaid: false,
          isCardPayment: true,
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }).toArray();

        if (transactionsForCycle.length > 0) {
          const totalAmount = transactionsForCycle.reduce((sum, t) => sum + t.amount, 0);
          pendingSummaries.push({
            cardId: card.id,
            cardName: card.name,
            cardBank: card.bank,
            totalAmount,
            transactions: transactionsForCycle.map(mapMongoDocument),
            cycleStartDate: startDate.toISOString(),
            cycleEndDate: endDate.toISOString(),
          });
        }
      }
    }
    
    // Fetch paid summaries
    const sixMonthsAgo = subMonths(new Date(), 6);
    const paidSummaryPayments = await transactionsCollection.find({
      userId,
      isSummaryPayment: true,
      date: { $gte: sixMonthsAgo }
    }).sort({ date: -1 }).limit(10).toArray();

    const paidSummaries: PaidSummary[] = paidSummaryPayments.map(tx => ({
      id: tx._id.toString(),
      cardName: tx.description.replace('Payment for card summary: ', ''),
      paymentDate: new Date(tx.date).toISOString(),
      amount: tx.amount
    }));

    return { 
      pendingSummaries: pendingSummaries.sort((a, b) => b.totalAmount - a.totalAmount),
      paidSummaries
    };
  } catch (error) {
    return handleActionError(error, 'fetch card summaries');
  }
}

export async function payCardSummary(
  userId: string,
  cardId: string,
  paymentAmount: number,
  paymentDate: Date,
  paymentMethodId: string,
  description: string,
  cycleStartDate?: string,
  cycleEndDate?: string
): Promise<{ success: true } | ErrorResponse> {
  try {
    validateUserId(userId);
    
    const { transactionsCollection, categoriesCollection } = await getDb();

    let paymentCategory = await categoriesCollection.findOne({ userId, name: "Taxes" });
    if (!paymentCategory) {
      paymentCategory = await categoriesCollection.findOne({ userId, name: "Other" });
      if (!paymentCategory) {
        throw new Error("Default categories 'Taxes' or 'Other' not found.");
      }
    }
    const paymentCategoryId = paymentCategory._id.toString();

    const paymentTransaction = {
      userId,
      description,
      amount: paymentAmount,
      date: paymentDate,
      categoryId: paymentCategoryId,
      type: 'expense' as 'expense',
      paymentMethodId,
      isCardPayment: false,
      isPaid: true,
      isSummaryPayment: true,
    };
    const insertResult = await transactionsCollection.insertOne(paymentTransaction);
    
    if (!insertResult.insertedId) {
      throw new Error('Failed to create payment transaction.');
    }
    
    const filter: any = {
      userId,
      cardId,
      isPaid: false,
      isCardPayment: true,
    };
    
    if (cycleStartDate && cycleEndDate) {
      filter.date = {
        $gte: new Date(cycleStartDate),
        $lte: new Date(cycleEndDate)
      };
    }

    const transactionsToPay = await transactionsCollection.find(filter).sort({ date: 1 }).toArray();

    let remainingAmountToPay = paymentAmount;
    const transactionIdsToUpdate: ObjectId[] = [];

    for (const transaction of transactionsToPay) {
      if (remainingAmountToPay <= 0) break;

      if (transaction.amount <= remainingAmountToPay) {
        transactionIdsToUpdate.push(transaction._id);
        remainingAmountToPay -= transaction.amount;
      } else {
        break;
      }
    }

    if (transactionIdsToUpdate.length > 0) {
      await transactionsCollection.updateMany(
        { _id: { $in: transactionIdsToUpdate } },
        { $set: { isPaid: true } }
      );
    }

    revalidateUserTags(userId, [CacheTag.TRANSACTIONS, CacheTag.CARD_SUMMARIES]);

    return { success: true };
  } catch (error) {
    return handleActionError(error, 'pay card summary');
  }
}
