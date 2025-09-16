'use server';

import * as admin from 'firebase-admin';

export async function initAdminApp() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable.');
  }

  if (admin.apps.length > 0) {
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}
