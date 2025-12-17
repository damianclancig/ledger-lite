
'use server';

import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase-admin';
import { getDb } from '@/lib/actions-helpers';
import { revalidateTag } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  let internalUserId = 'unknown';
  try {
    const { id } = await getAuthenticatedUser();
    internalUserId = id;
    const adminApp = initAdminApp();
    const adminAuth = getAuth(adminApp);
    const db = await getDb();
    const {
      usersCollection,
      transactionsCollection,
      taxesCollection,
      categoriesCollection,
      paymentMethodsCollection,
      savingsFundsCollection,
      billingCyclesCollection
    } = db;

    // Step 0: Find the user to get the firebaseUid
    const user = await usersCollection.findOne({ _id: internalUserId } as any);

    if (!user) {
      return { success: false, error: 'User not found in database.' };
    }

    const firebaseUid = user.firebaseUid;

    // Step 1: Delete from Firebase Authentication
    // If this fails, we might not want to delete the local data? OR we delete local data anyway?
    // Let's try to delete Firebase User first.
    try {
      await adminAuth.deleteUser(firebaseUid);
    } catch (firebaseError: any) {
      console.error("Error deleting Firebase user:", firebaseError);
      // Continue if user not found in firebase, otherwise might want to abort or flag
      if (firebaseError.code !== 'auth/user-not-found') {
        // Decide strictness: Fail hard or continue manual cleanup?
        // Let's fail hard for safety, but maybe allow force delete in future.
        // For now, return error.
        throw firebaseError;
      }
    }

    // Step 2: Delete all associated data from MongoDB using internalUserId
    await Promise.all([
      transactionsCollection.deleteMany({ userId: internalUserId }),
      taxesCollection.deleteMany({ userId: internalUserId }),
      categoriesCollection.deleteMany({ userId: internalUserId }),
      paymentMethodsCollection.deleteMany({ userId: internalUserId }),
      savingsFundsCollection.deleteMany({ userId: internalUserId }),
      billingCyclesCollection.deleteMany({ userId: internalUserId }),
      usersCollection.deleteOne({ _id: internalUserId } as any), // Delete the user record itself
    ]);

    // Step 3: Revalidate tags
    const userId = internalUserId; // Alias for consistency
    revalidateTag(`transactions_${userId}`);
    revalidateTag(`taxes_${userId}`);
    revalidateTag(`categories_${userId}`);
    revalidateTag(`paymentMethods_${userId}`);
    revalidateTag(`savingsFunds_${userId}`);
    revalidateTag(`billingCycles_${userId}`);

    return { success: true };

  } catch (error: any) {
    console.error(`Failed to delete user. Attempted on Internal User ID: ${internalUserId}. Raw Error:`, error);

    let errorMessage = 'An unknown error occurred during account deletion.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found in Firebase Authentication.';
    } else if (error.code === 'permission-denied' || error.code === 'app/invalid-credential') {
      errorMessage = 'Server configuration error (permissions).';
    }

    return { success: false, error: `Failed to delete account. Reason: ${errorMessage}` };
  }
}
