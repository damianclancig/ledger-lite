
import admin from 'firebase-admin';

// Helper function to safely parse the service account JSON from the environment variable
function getServiceAccount() {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
        throw new Error("Firebase Admin SDK Error: FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }
    try {
        return JSON.parse(serviceAccountEnv);
    } catch (e) {
        console.error("Firebase Admin SDK Error: Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
        throw new Error("Could not parse Firebase service account credentials.");
    }
}

let adminApp: admin.app.App;

export function initAdminApp() {
    // Check if the app is already initialized to prevent errors
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const serviceAccount = getServiceAccount();

    // Initialize the Firebase Admin SDK
    adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return adminApp;
}
