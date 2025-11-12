
'use server';

import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase-admin';
import { getDb } from '@/lib/actions-helpers';
import { revalidateTag } from 'next/cache';

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const adminApp = initAdminApp();
    const adminAuth = getAuth(adminApp);

    // Step 1: Delete the user from Firebase Authentication. This is the critical step.
    await adminAuth.deleteUser(userId);

    // Step 2: If authentication deletion is successful, proceed to delete all associated data from MongoDB.
    const { 
      transactionsCollection, 
      taxesCollection, 
      categoriesCollection, 
      paymentMethodsCollection, 
      savingsFundsCollection, 
      billingCyclesCollection 
    } = await getDb();
    
    await Promise.all([
      transactionsCollection.deleteMany({ userId }),
      taxesCollection.deleteMany({ userId }),
      categoriesCollection.deleteMany({ userId }),
      paymentMethodsCollection.deleteMany({ userId }),
      savingsFundsCollection.deleteMany({ userId }),
      billingCyclesCollection.deleteMany({ userId }),
    ]);

    // Step 3: Revalidate all user-specific tags to clear caches. This is good practice.
    revalidateTag(`transactions_${userId}`);
    revalidateTag(`taxes_${userId}`);
    revalidateTag(`categories_${userId}`);
    revalidateTag(`paymentMethods_${userId}`);
    revalidateTag(`savingsFunds_${userId}`);
    revalidateTag(`billingCycles_${userId}`);
    
    // Step 4: Return success. The client will handle the redirection.
    return { success: true };

  } catch (error: any) {
    console.error(`Failed to delete user. Attempted on User ID: ${userId}. Raw Error:`, error);
    
    let errorMessage = 'An unknown error occurred during account deletion.';
    
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found in Firebase Authentication. Please check if the client and server configurations point to the same Firebase project.';
    } else if (error.code === 'permission-denied' || error.code === 'app/invalid-credential') {
        errorMessage = 'Server does not have permission to delete users. Please check service account roles and configuration in Google Cloud.';
    }

    return { success: false, error: `Failed to delete account. Reason: ${errorMessage}` };
  }
}
