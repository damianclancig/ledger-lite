'use server';

import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase-admin';
import { getDb, mapMongoDocumentUser } from '@/lib/actions-helpers';
import type { User } from '@/types';
import { randomUUID } from 'crypto';

interface SyncUserResult {
    success: boolean;
    user?: User;
    error?: string;
    isNewUser?: boolean;
}

export async function syncUser(token: string): Promise<SyncUserResult> {
    if (!token) {
        return { success: false, error: 'No token provided' };
    }

    try {
        const adminApp = initAdminApp();
        const adminAuth = getAuth(adminApp);

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email || '';
        // Extract first and last name if available/provided in token (often name is just one string)
        // We can try to split 'name' claim if it exists
        let firstName = '';
        let lastName = '';

        if (decodedToken.name) {
            const nameParts = decodedToken.name.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
        }

        const { usersCollection, transactionsCollection, taxesCollection, categoriesCollection, paymentMethodsCollection, savingsFundsCollection, billingCyclesCollection } = await getDb();

        // Check if user exists
        const existingUser = await usersCollection.findOne({ firebaseUid });

        if (existingUser) {
            // Update last login
            await usersCollection.updateOne(
                { firebaseUid },
                { $set: { lastLogin: new Date() } }
            );
            return { success: true, user: mapMongoDocumentUser(existingUser) };
        }

        // NEW USER Creation
        // Check for "Legacy" data (data associated with firebaseUid directly)
        // This is the "Soft-Reset" / Migration logic
        const hasLegacyData = await transactionsCollection.findOne({ userId: firebaseUid });

        const newUserId = randomUUID();
        const now = new Date();

        const newUser: Omit<User, 'id'> = {
            firebaseUid,
            email,
            firstName,
            lastName,
            createdAt: now.toISOString(),
            lastLogin: now.toISOString(),
            // The ID is the _id of the document, but we want to enforce our UUID if we use it as FK
            // MongoDB _id is ObjectId by default. 
            // Option A: Use _id as UUID (needs specific driver setup or storing as string)
            // Option B: Use a separate 'id' field. The interface implies 'id' is a string.
            // Let's use _id as the UUID string to simplify, or store it as _id.
            // mapMongoDocument expects _id to be there. 
        };

        // Correct approach using string _id to match our UUID usage
        const userDocStrId = {
            _id: newUserId,
            ...newUser
        };

        await usersCollection.insertOne(userDocStrId as any);

        if (hasLegacyData) {
            console.log(`Migrating legacy data for user ${firebaseUid} to new ID ${newUserId}`);
            // Migrate all collections
            await Promise.all([
                transactionsCollection.updateMany({ userId: firebaseUid }, { $set: { userId: newUserId } }),
                taxesCollection.updateMany({ userId: firebaseUid }, { $set: { userId: newUserId } }),
                categoriesCollection.updateMany({ userId: firebaseUid }, { $set: { userId: newUserId } }),
                paymentMethodsCollection.updateMany({ userId: firebaseUid }, { $set: { userId: newUserId } }),
                savingsFundsCollection.updateMany({ userId: firebaseUid }, { $set: { userId: newUserId } }),
                billingCyclesCollection.updateMany({ userId: firebaseUid }, { $set: { userId: newUserId } }),
            ]);
            console.log(`Migration complete for user ${firebaseUid}`);
        }

        // Fetch the newly created user to return it correctly mapped
        const createdUser = await usersCollection.findOne({ _id: newUserId });

        if (!createdUser) throw new Error("Failed to retrieve created user");

        return { success: true, user: mapMongoDocumentUser(createdUser), isNewUser: true };

    } catch (error) {
        console.error("Error syncing user:", error);
        return { success: false, error: 'Authentication failed' };
    }
}
