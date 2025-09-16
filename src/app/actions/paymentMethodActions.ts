'use server';

import { revalidateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDb, mapMongoDocumentPaymentMethod } from '@/lib/actions-helpers';
import type { PaymentMethod, PaymentMethodFormValues } from '@/types';

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
