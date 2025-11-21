import { revalidateTag } from 'next/cache';

/**
 * Enum for all cache tags used in the application
 * Provides type safety and prevents typos in tag names
 */
export enum CacheTag {
  TRANSACTIONS = 'transactions',
  TAXES = 'taxes',
  SAVINGS_FUNDS = 'savingsFunds',
  CARD_SUMMARIES = 'cardSummaries',
  CATEGORIES = 'categories',
  PAYMENT_METHODS = 'paymentMethods',
  BILLING_CYCLES = 'billingCycles',
  INSTALLMENT_DETAILS = 'installmentDetails',
}

/**
 * Revalidates multiple cache tags for a specific user
 * @param userId - The user ID to revalidate tags for
 * @param tags - Array of cache tags to revalidate
 */
export function revalidateUserTags(
  userId: string,
  tags: CacheTag[]
): void {
  tags.forEach(tag => revalidateTag(`${tag}_${userId}`));
}

/**
 * Revalidates a single cache tag for a specific user
 * @param userId - The user ID to revalidate the tag for
 * @param tag - The cache tag to revalidate
 */
export function revalidateUserTag(
  userId: string,
  tag: CacheTag
): void {
  revalidateTag(`${tag}_${userId}`);
}

/**
 * Common tag combinations for different operations
 */
export const TagGroups = {
  /**
   * Tags to revalidate when a transaction is added/updated/deleted
   */
  TRANSACTION_MUTATION: [
    CacheTag.TRANSACTIONS,
    CacheTag.TAXES,
    CacheTag.SAVINGS_FUNDS,
    CacheTag.CARD_SUMMARIES,
  ] as CacheTag[],
  
  /**
   * Tags to revalidate when a savings fund is modified
   */
  SAVINGS_FUND_MUTATION: [
    CacheTag.SAVINGS_FUNDS,
    CacheTag.TRANSACTIONS,
  ] as CacheTag[],
  
  /**
   * Tags to revalidate when a billing cycle is created/updated
   */
  BILLING_CYCLE_MUTATION: [
    CacheTag.BILLING_CYCLES,
    CacheTag.TRANSACTIONS,
  ] as CacheTag[],
  
  /**
   * Tags to revalidate when user data is deleted (all tags)
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
