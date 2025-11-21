import type { Collection } from 'mongodb';

/**
 * Calculates the current amount in a savings fund by aggregating all transactions
 * @param userId - The user ID
 * @param fundIdStr - The savings fund ID as a string
 * @param transactionsCollection - MongoDB transactions collection
 * @returns The current amount in the fund (deposits minus withdrawals)
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
 * Checks if a category is being used by any transactions
 * @param categoryId - The category ID to check
 * @param userId - The user ID
 * @param transactionsCollection - MongoDB transactions collection
 * @returns True if the category is in use, false otherwise
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
 * Checks if a payment method is being used by any transactions
 * @param paymentMethodId - The payment method ID to check
 * @param userId - The user ID
 * @param transactionsCollection - MongoDB transactions collection
 * @returns True if the payment method is in use, false otherwise
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
