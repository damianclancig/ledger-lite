import { MongoClient, type WithId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Transaction, Tax, Category, PaymentMethod } from '@/types';

// Helper function to get the database and collection
export async function getDb() {
  const client: MongoClient = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'ledger_lite');
  return { 
    db, 
    transactionsCollection: db.collection('transactions'),
    taxesCollection: db.collection('taxes'),
    categoriesCollection: db.collection('categories'),
    paymentMethodsCollection: db.collection('paymentMethods'),
  };
}

// Map MongoDB's _id and other fields to a serializable object
export function mapMongoDocument(doc: WithId<Document>): Transaction {
  const { _id, date, ...rest } = doc;
  return { 
    id: _id.toString(),
    date: new Date(date), // Ensure date is a Date object on the server
    ...rest 
  } as Transaction;
}

export function mapMongoDocumentTax(doc: WithId<Document>): Tax {
  const { _id, date, ...rest } = doc;
  return {
    id: _id.toString(),
    date: new Date(date),
    ...rest
  } as Tax;
}

export function mapMongoDocumentCategory(doc: WithId<Document>): Category {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  } as Category;
}

export function mapMongoDocumentPaymentMethod(doc: WithId<Document>): PaymentMethod {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  } as PaymentMethod;
}
