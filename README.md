# Ledger Lite on Firebase Studio

This is a Next.js application for tracking personal income and expenses, built with Firebase Studio.

## Getting Started

To run the application, it requires a connection to a MongoDB database and a Firebase project for authentication.

### Firebase Setup (for Authentication)

1.  This project uses Firebase Authentication for Google Sign-In.
2.  Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
3.  In your project, go to **Authentication** -> **Sign-in method** and enable the **Google** provider.
4.  Go to **Project settings** -> **General** and register a new **Web app**.
5.  After registering, Firebase will provide you with a `firebaseConfig` object.
6.  Open the `.env.local` file in the project's root directory.
7.  Copy the values from the `firebaseConfig` object into the corresponding `NEXT_PUBLIC_FIREBASE_*` variables.

### Database Setup (for Data)

1.  This project is configured to use MongoDB. You will need a MongoDB database to store your transactions. You can create a free one at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Once you have your database, you need to get the **connection string (URI)**.
3.  Open the `.env.local` file in the project's root directory.
4.  Replace the placeholder value for `MONGODB_URI` with your actual MongoDB connection string.
5.  You can also specify the database name with the `MONGODB_DB` variable, which defaults to `ledger_lite`.

**Important**: The application will start now, but it will not be able to save, load data, or authenticate users until you configure both Firebase and MongoDB correctly.

### Running the App

Once the environment variables are set, you can explore the application's features, starting with `src/app/page.tsx`.
