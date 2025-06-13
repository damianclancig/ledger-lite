import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
};

// This simplified setup creates a new client on each module evaluation.
// While not standard practice for performance, it has proven to be the stable
// solution for this specific development environment.
const client = new MongoClient(uri, options);
const clientPromise = client.connect();

export default clientPromise;
