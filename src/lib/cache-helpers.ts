import { revalidateTag } from 'next/cache';

/**
 * Enum for all cache tags used in the application.
 * 
 * Provides type safety and prevents typos in tag names.
 * All cache tags follow the pattern: `{tag}_{userId}` when used.
 * 
 * @example
 * ```typescript
 * // Type-safe cache tag usage
 * revalidateUserTag(userId, CacheTag.TRANSACTIONS);
 * // Instead of error-prone string: revalidateTag(`transactions_${userId}`)
 * ```
 */
export enum CacheTag {
  /** Cache tag for transaction data */
  TRANSACTIONS = 'transactions',
  /** Cache tag for tax data */
  TAXES = 'taxes',
  /** Cache tag for savings funds data */
  SAVINGS_FUNDS = 'savingsFunds',
  /** Cache tag for credit card summaries */
  CARD_SUMMARIES = 'cardSummaries',
  /** Cache tag for category data */
  CATEGORIES = 'categories',
  /** Cache tag for payment methods */
  PAYMENT_METHODS = 'paymentMethods',
  /** Cache tag for billing cycles */
  BILLING_CYCLES = 'billingCycles',
  /** Cache tag for installment details */
  INSTALLMENT_DETAILS = 'installmentDetails',
}

/**
 * Revalidates multiple cache tags for a specific user.
 * 
 * Efficiently invalidates multiple cache tags in a single call,
 * useful when an operation affects multiple data types.
 * 
 * @param userId - The user ID to revalidate tags for
 * @param tags - Array of cache tags to revalidate
 * 
 * @example
 * ```typescript
 * // After adding a transaction, revalidate multiple related caches
 * revalidateUserTags(userId, [
 *   CacheTag.TRANSACTIONS,
 *   CacheTag.TAXES,
 *   CacheTag.SAVINGS_FUNDS,
 * ]);
 * 
 * // Or use a predefined tag group
 * revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);
 * ```
 */
export function revalidateUserTags(
  userId: string,
  tags: CacheTag[]
): void {
  tags.forEach(tag => revalidateTag(`${tag}_${userId}`));
}

/**
 * Revalidates a single cache tag for a specific user.
 * 
 * Invalidates the cache for a specific data type and user,
 * forcing Next.js to refetch the data on the next request.
 * 
 * @param userId - The user ID to revalidate the tag for
 * @param tag - The cache tag to revalidate
 * 
 * @example
 * ```typescript
 * // After updating a category, revalidate only categories cache
 * revalidateUserTag(userId, CacheTag.CATEGORIES);
 * 
 * // After deleting a payment method
 * revalidateUserTag(userId, CacheTag.PAYMENT_METHODS);
 * ```
 */
export function revalidateUserTag(
  userId: string,
  tag: CacheTag
): void {
  revalidateTag(`${tag}_${userId}`);
}

/**
 * Predefined tag groups for common operations.
 * 
 * These groups represent the typical cache invalidation patterns
 * needed when performing different types of mutations. Using these
 * groups ensures consistent cache invalidation across the application.
 * 
 * @example
 * ```typescript
 * // After adding a transaction
 * revalidateUserTags(userId, TagGroups.TRANSACTION_MUTATION);
 * 
 * // After modifying a savings fund
 * revalidateUserTags(userId, TagGroups.SAVINGS_FUND_MUTATION);
 * ```
 */
export const TagGroups = {
  /**
   * Tags to revalidate when a transaction is added, updated, or deleted.
   * 
   * Includes:
   * - Transactions (direct change)
   * - Taxes (may be affected by transaction type)
   * - Savings funds (may be affected by fund allocations)
   * - Card summaries (credit card payment tracking)
   */
  TRANSACTION_MUTATION: [
    CacheTag.TRANSACTIONS,
    CacheTag.TAXES,
    CacheTag.SAVINGS_FUNDS,
    CacheTag.CARD_SUMMARIES,
  ] as CacheTag[],
  
  /**
   * Tags to revalidate when a savings fund is modified.
   * 
   * Includes:
   * - Savings funds (direct change)
   * - Transactions (fund transfers create transactions)
   */
  SAVINGS_FUND_MUTATION: [
    CacheTag.SAVINGS_FUNDS,
    CacheTag.TRANSACTIONS,
  ] as CacheTag[],
  
  /**
   * Tags to revalidate when a billing cycle is created or updated.
   * 
   * Includes:
   * - Billing cycles (direct change)
   * - Transactions (cycle affects transaction filtering)
   */
  BILLING_CYCLE_MUTATION: [
    CacheTag.BILLING_CYCLES,
    CacheTag.TRANSACTIONS,
  ] as CacheTag[],
  
  /**
   * Tags to revalidate when user data is deleted (all user-related caches).
   * 
   * Includes all cache tags to ensure complete data cleanup.
   */
  USER_DATA_DELETION: [
    CacheTag.TRANSACTIONS,
    CacheTag.TAXES,
    CacheTag.CATEGORIES,
    CacheTag.PAYMENT_METHODS,
    CacheTag.SAVINGS_FUNDS,
    CacheTag.BILLING_CYCLES,
  ] as CacheTag[],
} as const;
