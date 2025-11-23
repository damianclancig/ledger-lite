/**
 * MongoDB Index Creation Script
 * 
 * This script creates all necessary indexes for optimal query performance.
 * Run this script once to set up indexes on all collections.
 * 
 * Usage:
 *   npx tsx scripts/create-indexes.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'ledger_lite';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function createIndexes() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const db = client.db(MONGODB_DB);

    // ========================================
    // TRANSACTIONS (Critical - Highest Impact)
    // ========================================
    console.log('📊 Creating indexes for TRANSACTIONS collection...');
    const transactions = db.collection('transactions');
    
    await transactions.createIndex(
      { userId: 1, date: -1 },
      { name: 'userId_date' }
    );
    console.log('  ✅ userId_date');

    await transactions.createIndex(
      { userId: 1, type: 1, isCardPayment: 1, date: -1 },
      { name: 'userId_type_isCardPayment_date' }
    );
    console.log('  ✅ userId_type_isCardPayment_date');

    await transactions.createIndex(
      { userId: 1, savingsFundId: 1 },
      { name: 'userId_savingsFundId' }
    );
    console.log('  ✅ userId_savingsFundId');

    await transactions.createIndex(
      { userId: 1, cardId: 1, isPaid: 1, isCardPayment: 1, date: -1 },
      { name: 'userId_cardId_isPaid_isCardPayment_date' }
    );
    console.log('  ✅ userId_cardId_isPaid_isCardPayment_date');

    await transactions.createIndex(
      { userId: 1, groupId: 1 },
      { name: 'userId_groupId' }
    );
    console.log('  ✅ userId_groupId');

    await transactions.createIndex(
      { userId: 1, isSummaryPayment: 1, date: -1 },
      { name: 'userId_isSummaryPayment_date' }
    );
    console.log('  ✅ userId_isSummaryPayment_date\n');

    // ========================================
    // TAXES
    // ========================================
    console.log('📊 Creating indexes for TAXES collection...');
    const taxes = db.collection('taxes');

    await taxes.createIndex(
      { userId: 1, year: -1, month: -1 },
      { name: 'userId_year_month' }
    );
    console.log('  ✅ userId_year_month');

    await taxes.createIndex(
      { userId: 1, name: 1, month: 1, year: 1 },
      { name: 'userId_name_month_year_unique', unique: true }
    );
    console.log('  ✅ userId_name_month_year_unique (unique)');

    await taxes.createIndex(
      { userId: 1, year: 1 },
      { name: 'userId_year_legacy' }
    );
    console.log('  ✅ userId_year_legacy\n');

    // ========================================
    // CATEGORIES
    // ========================================
    console.log('📊 Creating indexes for CATEGORIES collection...');
    const categories = db.collection('categories');

    await categories.createIndex(
      { userId: 1, isSystem: -1, name: 1 },
      { name: 'userId_isSystem_name' }
    );
    console.log('  ✅ userId_isSystem_name');

    await categories.createIndex(
      { userId: 1, name: 1 },
      { name: 'userId_name_unique', unique: true }
    );
    console.log('  ✅ userId_name_unique (unique)\n');

    // ========================================
    // PAYMENT METHODS
    // ========================================
    console.log('📊 Creating indexes for PAYMENT_METHODS collection...');
    const paymentMethods = db.collection('paymentMethods');

    await paymentMethods.createIndex(
      { userId: 1, type: 1 },
      { name: 'userId_type' }
    );
    console.log('  ✅ userId_type');

    await paymentMethods.createIndex(
      { userId: 1, name: 1 },
      { name: 'userId_name' }
    );
    console.log('  ✅ userId_name\n');

    // ========================================
    // SAVINGS FUNDS
    // ========================================
    console.log('📊 Creating indexes for SAVINGS_FUNDS collection...');
    const savingsFunds = db.collection('savingsFunds');

    await savingsFunds.createIndex(
      { userId: 1, name: 1 },
      { name: 'userId_name' }
    );
    console.log('  ✅ userId_name\n');

    // ========================================
    // BILLING CYCLES
    // ========================================
    console.log('📊 Creating indexes for BILLING_CYCLES collection...');
    const billingCycles = db.collection('billingCycles');

    await billingCycles.createIndex(
      { userId: 1, startDate: -1 },
      { name: 'userId_startDate' }
    );
    console.log('  ✅ userId_startDate');

    await billingCycles.createIndex(
      { userId: 1, endDate: 1 },
      { name: 'userId_endDate' }
    );
    console.log('  ✅ userId_endDate\n');

    console.log('✅ All indexes created successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Transactions: 6 indexes');
    console.log('  - Taxes: 3 indexes');
    console.log('  - Categories: 2 indexes');
    console.log('  - Payment Methods: 2 indexes');
    console.log('  - Savings Funds: 1 index');
    console.log('  - Billing Cycles: 2 indexes');
    console.log('  - Total: 16 indexes\n');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

createIndexes();
