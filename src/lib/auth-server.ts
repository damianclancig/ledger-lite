import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase-admin';
import { getDb, mapMongoDocumentUser } from '@/lib/actions-helpers';
import { ValidationError } from '@/lib/validation-helpers';
import type { User } from '@/types';

/**
 * Retrieves the authenticated user from the current session cookie.
 * 
 * Flow:
 * 1. Reads '__session' cookie.
 * 2. Verifies cookie with Firebase Admin.
 * 3. Queries MongoDB for the user with the matching firebaseUid.
 * 4. Returns the User object (with internal ID).
 * 
 * @throws {ValidationError} If no session exists or user is not found.
 */
export async function getAuthenticatedUser(): Promise<User> {
    const sessionCookie = (await cookies()).get('__session')?.value;

    if (!sessionCookie) {
        throw new ValidationError('Unauthorized: No session found');
    }

    try {
        const adminApp = initAdminApp();
        const auth = getAuth(adminApp);

        // Verify session cookie
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const firebaseUid = decodedClaims.uid;

        const { usersCollection } = await getDb();
        const userDoc = await usersCollection.findOne({ firebaseUid });

        if (!userDoc) {
            throw new ValidationError('Unauthorized: User not found');
        }

        return mapMongoDocumentUser(userDoc);
    } catch (error) {
        console.error('Error verifying session:', error);
        throw new ValidationError('Unauthorized: Invalid session');
    }
}
