'use server';

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase-admin';

// 14 days in milliseconds (Firebase maximum is 2 weeks)
const EXPIN = 60 * 60 * 24 * 14 * 1000;

export async function createSession(idToken: string) {
    try {
        const adminApp = initAdminApp();
        const auth = getAuth(adminApp);

        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIN });

        (await cookies()).set('__session', sessionCookie, {
            maxAge: EXPIN / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return { success: false, error: 'Unauthorized' };
    }
}

export async function deleteSession() {
    try {
        (await cookies()).delete('__session');
        return { success: true };
    } catch (error) {
        console.error('Error deleting session cookie:', error);
        return { success: false, error: 'Failed to logout' };
    }
}
