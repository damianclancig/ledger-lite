
'use server';

import { revalidateTag } from 'next/cache';
import { getDb, mapMongoDocument, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import type { CardSummary, PaymentMethod, Transaction } from '@/types';
import { ObjectId } from 'mongodb';

export async function getCardSummaries(userId: string): Promise<CardSummary[]> {
    if (!userId) return [];
    try {
        const { transactionsCollection, paymentMethodsCollection } = await getDb();

        const creditCards = await paymentMethodsCollection.find({ userId, type: 'Credit Card' }).toArray();
        if (creditCards.length === 0) return [];

        // Fetch unpaid card transactions with a date up to the end of today
        const unpaidCardTransactions = await transactionsCollection.find({
            userId,
            isCardPayment: true,
            isPaid: false,
            date: { $lte: new Date() } // Only include transactions due today or in the past
        }).sort({ date: 1 }).toArray();

        const summaries: CardSummary[] = creditCards.map(card => {
            const cardIdStr = card._id.toString();
            const transactionsForCard = unpaidCardTransactions
                .filter(t => t.cardId === cardIdStr)
                .map(mapMongoDocument);
            
            const totalAmount = transactionsForCard.reduce((sum, t) => sum + t.amount, 0);

            return {
                cardId: cardIdStr,
                cardName: card.name,
                cardBank: card.bank,
                totalAmount,
                transactions: transactionsForCard,
            };
        }).filter(summary => summary.transactions.length > 0);

        return summaries;

    } catch (error) {
        console.error('Error fetching card summaries:', error);
        return [];
    }
}

export async function payCardSummary(
    userId: string,
    cardId: string,
    paymentAmount: number,
    paymentDate: Date,
    paymentMethodId: string,
    description: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };

    try {
        const { transactionsCollection } = await getDb();

        // 1. Create the actual expense transaction for the payment
        const paymentTransaction = {
            userId,
            description,
            amount: paymentAmount,
            date: paymentDate,
            categoryId: 'CARD_PAYMENT', // Special category for card payments
            type: 'expense',
            paymentMethodId,
            isCardPayment: false,
            isPaid: true,
        };
        const insertResult = await transactionsCollection.insertOne(paymentTransaction);
        
        if(!insertResult.insertedId) {
            throw new Error('Failed to create payment transaction.');
        }

        // 2. Find and mark individual card transactions as paid
        const transactionsToPay = await transactionsCollection.find({
            userId,
            cardId,
            isPaid: false
        }).sort({ date: 1 }).toArray();

        let remainingAmountToPay = paymentAmount;
        const transactionIdsToUpdate: ObjectId[] = [];

        for (const transaction of transactionsToPay) {
            if (remainingAmountToPay <= 0) break;

            if (transaction.amount <= remainingAmountToPay) {
                transactionIdsToUpdate.push(transaction._id);
                remainingAmountToPay -= transaction.amount;
            } else {
                // Partial payment case: This logic can be complex.
                // For simplicity, we only mark full transactions as paid.
                // A more advanced version could split the transaction.
                break;
            }
        }

        if (transactionIdsToUpdate.length > 0) {
            await transactionsCollection.updateMany(
                { _id: { $in: transactionIdsToUpdate } },
                { $set: { isPaid: true } }
            );
        }

        revalidateTag(`transactions_${userId}`);
        revalidateTag(`cardSummaries_${userId}`);

        return { success: true };
    } catch (error) {
        console.error('Error paying card summary:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to pay card summary. ${errorMessage}` };
    }
}

    
