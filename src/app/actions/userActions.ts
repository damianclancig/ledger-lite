'use server';

import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/actions-helpers';

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const { initAdminApp } = await import('@/lib/firebase-admin');
    
    await initAdminApp();
    const { transactionsCollection, taxesCollection, categoriesCollection, paymentMethodsCollection } = await getDb();
    
    await Promise.all([
      transactionsCollection.deleteMany({ userId }),
      taxesCollection.deleteMany({ userId }),
      categoriesCollection.deleteMany({ userId }),
      paymentMethodsCollection.deleteMany({ userId }),
    ]);

    await getAuth().deleteUser(userId);

    revalidateTag(`transactions_${userId}`);
    revalidateTag(`taxes_${userId}`);
    revalidateTag(`categories_${userId}`);
    revalidateTag(`paymentMethods_${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete account. ${errorMessage}` };
  }
}
