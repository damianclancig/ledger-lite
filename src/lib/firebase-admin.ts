import admin from 'firebase-admin';

// Helper function to safely parse the service account JSON from the environment variable
function getServiceAccount() {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
        console.error("Firebase Admin SDK Error: FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
        return null;
    }
    try {
        return JSON.parse(serviceAccountEnv);
    } catch (e) {
        console.error("Firebase Admin SDK Error: Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
        return null;
    }
}

export function initAdminApp() {
    // Check if the app is already initialized to prevent errors
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
        throw new Error('Firebase Admin SDK credentials are not configured correctly. Check environment variables.');
    }

    // Initialize the Firebase Admin SDK
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
