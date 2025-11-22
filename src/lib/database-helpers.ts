import type { Collection } from 'mongodb';

/**
 * Calculates the current amount in a savings fund.
 * 
 * Aggregates all transactions associated with a savings fund to calculate
 * the current balance. Deposits add to the total, withdrawals subtract from it.
 * 
 * This function uses MongoDB aggregation pipeline for efficient calculation
 * directly in the database.
 * 
 * @param userId - The user ID who owns the fund
 * @param fundIdStr - The savings fund ID as a string
 * @param transactionsCollection - MongoDB transactions collection
 * @returns The current amount in the fund (can be negative if overdrawn)
 * 
 * @example
 * ```typescript
 * const { transactionsCollection } = await getDb();
 * const currentAmount = await calculateFundCurrentAmount(
 *   userId,
 *   fundId.toString(),
 *   transactionsCollection
 * );
 * console.log(`Fund balance: $${currentAmount}`);
 * ```
 */
export async function calculateFundCurrentAmount(
  userId: string,
  fundIdStr: string,
  transactionsCollection: Collection
): Promise<number> {
  const pipeline = [
    { $match: { userId, savingsFundId: fundIdStr } },
    {
      $group: {
        _id: '$savingsFundId',
        total: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'deposit'] },
              '$amount',
              { $multiply: ['$amount', -1] }
            ]
          }
        }
      }
    }
  ];

  const result = await transactionsCollection.aggregate(pipeline).toArray();
  return result.length > 0 ? result[0].total : 0;
}

/**
 * Checks if a category is currently being used by any transactions.
 * 
 * Used to prevent deletion of categories that are referenced by
 * existing transactions, maintaining referential integrity.
 * 
 * @param categoryId - The category ID to check
 * @param userId - The user ID who owns the category
 * @param transactionsCollection - MongoDB transactions collection
 * @returns True if the category is in use, false otherwise
 * 
 * @example
 * ```typescript
 * const { transactionsCollection } = await getDb();
 * const inUse = await isCategoryInUse(categoryId, userId, transactionsCollection);
 * 
 * if (inUse) {
 *   return { error: 'Cannot delete category that is in use by transactions.' };
 * }
 * 
 * // Safe to delete
 * await categoriesCollection.deleteOne({ _id: new ObjectId(categoryId) });
 * ```
 */
export async function isCategoryInUse(
  categoryId: string,
  userId: string,
  transactionsCollection: Collection
): Promise<boolean> {
  const count = await transactionsCollection.countDocuments({ categoryId, userId });
  return count > 0;
}

/**
 * Checks if a payment method is currently being used by any transactions.
 * 
 * Used to prevent deletion of payment methods that are referenced by
 * existing transactions, maintaining referential integrity.
 * 
 * @param paymentMethodId - The payment method ID to check
 * @param userId - The user ID who owns the payment method
 * @param transactionsCollection - MongoDB transactions collection
 * @returns True if the payment method is in use, false otherwise
 * 
 * @example
 * ```typescript
 * const { transactionsCollection } = await getDb();
 * const inUse = await isPaymentMethodInUse(
 *   paymentMethodId,
 *   userId,
 *   transactionsCollection
 * );
 * 
 * if (inUse) {
 *   return { error: 'Cannot delete payment method that is in use.' };
 * }
 * 
 * // Safe to delete
 * await paymentMethodsCollection.deleteOne({ _id: new ObjectId(paymentMethodId) });
 * ```
 */
export async function isPaymentMethodInUse(
  paymentMethodId: string,
  userId: string,
  transactionsCollection: Collection
): Promise<boolean> {
  const count = await transactionsCollection.countDocuments({ 
    paymentMethodId, 
    userId 
  });
  return count > 0;
}
