'use server';

import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/actions-helpers';
import { initAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const adminApp = initAdminApp();
    const adminAuth = getAuth(adminApp);

    // First, delete the user from Firebase Authentication
    await adminAuth.deleteUser(userId);

    // If successful, proceed to delete data from MongoDB
    const { transactionsCollection, taxesCollection, categoriesCollection, paymentMethodsCollection, savingsFundsCollection } = await getDb();
    
    await Promise.all([
      transactionsCollection.deleteMany({ userId }),
      taxesCollection.deleteMany({ userId }),
      categoriesCollection.deleteMany({ userId }),
      paymentMethodsCollection.deleteMany({ userId }),
      savingsFundsCollection.deleteMany({ userId }),
    ]);

    // Revalidate all user-specific tags
    revalidateTag(`transactions_${userId}`);
    revalidateTag(`taxes_${userId}`);
    revalidateTag(`categories_${userId}`);
    revalidateTag(`paymentMethods_${userId}`);
    revalidateTag(`savingsFunds_${userId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    
    // Handle case where user is already deleted from Firebase Auth but not DB
    if (error.code === 'auth/user-not-found') {
        console.warn(`User ${userId} not found in Firebase Auth, proceeding with database cleanup as a fallback.`);
         const { transactionsCollection, taxesCollection, categoriesCollection, paymentMethodsCollection, savingsFundsCollection } = await getDb();
        await Promise.all([
            transactionsCollection.deleteMany({ userId }),
            taxesCollection.deleteMany({ userId }),
            categoriesCollection.deleteMany({ userId }),
            paymentMethodsCollection.deleteMany({ userId }),
            savingsFundsCollection.deleteMany({ userId }),
        ]);
        return { success: true };
    }

    const errorMessage = error.message || 'An unknown error occurred';
    return { success: false, error: `Failed to delete account. ${errorMessage}` };
  }
}
