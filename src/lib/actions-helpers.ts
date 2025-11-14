
import { MongoClient, type WithId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Transaction, Tax, Category, PaymentMethod, SavingsFund, BillingCycle } from '@/types';

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
    savingsFundsCollection: db.collection('savingsFunds'),
    billingCyclesCollection: db.collection('billingCycles'),
  };
}

function mapBaseDocument<T>(doc: WithId<Document>): T {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as T;
}

// Map MongoDB's _id and other fields to a serializable object
export function mapMongoDocument(doc: WithId<Document>): Transaction {
  const baseDoc = mapBaseDocument<Omit<Transaction, 'date'>>(doc as any);
  return { 
    ...baseDoc,
    date: new Date(doc.date).toISOString(), // Standardize to ISO string
  };
}

export function mapMongoDocumentTax(doc: WithId<Document>): Tax {
  const baseDoc = mapBaseDocument<Omit<Tax, 'date'>>(doc as any);
  return {
    ...baseDoc,
    date: doc.date ? new Date(doc.date).toISOString() : undefined,
  };
}

export function mapMongoDocumentCategory(doc: WithId<Document>): Category {
  return mapBaseDocument<Category>(doc);
}

export function mapMongoDocumentPaymentMethod(doc: WithId<Document>): PaymentMethod {
  return mapBaseDocument<PaymentMethod>(doc);
}

export function mapMongoDocumentSavingsFund(doc: WithId<Document>): SavingsFund {
  const baseDoc = mapBaseDocument<Omit<SavingsFund, 'targetDate'>>(doc as any);
  return {
    ...baseDoc,
    targetDate: doc.targetDate ? new Date(doc.targetDate).toISOString() : undefined,
  };
}

export function mapMongoDocumentBillingCycle(doc: WithId<Document>): BillingCycle {
    const baseDoc = mapBaseDocument<Omit<BillingCycle, 'startDate' | 'endDate'>>(doc as any);
    return {
      ...baseDoc,
      startDate: new Date(doc.startDate).toISOString(),
      endDate: doc.endDate ? new Date(doc.endDate).toISOString() : undefined,
    };
  }

    