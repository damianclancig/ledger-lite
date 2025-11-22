import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CacheTag,
  revalidateUserTag,
  revalidateUserTags,
  TagGroups,
} from './cache-helpers';

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

// Import after mocking
const { revalidateTag } = await import('next/cache');

describe('CacheTag enum', () => {
  it('should have all expected tags', () => {
    expect(CacheTag.TRANSACTIONS).toBe('transactions');
    expect(CacheTag.TAXES).toBe('taxes');
    expect(CacheTag.SAVINGS_FUNDS).toBe('savingsFunds');
    expect(CacheTag.CARD_SUMMARIES).toBe('cardSummaries');
    expect(CacheTag.CATEGORIES).toBe('categories');
    expect(CacheTag.PAYMENT_METHODS).toBe('paymentMethods');
    expect(CacheTag.BILLING_CYCLES).toBe('billingCycles');
    expect(CacheTag.INSTALLMENT_DETAILS).toBe('installmentDetails');
  });
});

describe('revalidateUserTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call revalidateTag with correct format', () => {
    revalidateUserTag('user123', CacheTag.TRANSACTIONS);
    
    expect(revalidateTag).toHaveBeenCalledWith('transactions_user123');
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it('should work with different tags', () => {
    revalidateUserTag('user456', CacheTag.CATEGORIES);
    
    expect(revalidateTag).toHaveBeenCalledWith('categories_user456');
  });

  it('should work with all cache tags', () => {
    const userId = 'testUser';
    
    revalidateUserTag(userId, CacheTag.TRANSACTIONS);
    revalidateUserTag(userId, CacheTag.TAXES);
    revalidateUserTag(userId, CacheTag.SAVINGS_FUNDS);
    revalidateUserTag(userId, CacheTag.CARD_SUMMARIES);
    revalidateUserTag(userId, CacheTag.CATEGORIES);
    revalidateUserTag(userId, CacheTag.PAYMENT_METHODS);
    revalidateUserTag(userId, CacheTag.BILLING_CYCLES);
    revalidateUserTag(userId, CacheTag.INSTALLMENT_DETAILS);
    
    expect(revalidateTag).toHaveBeenCalledTimes(8);
  });
});

describe('revalidateUserTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call revalidateTag for each tag', () => {
    const tags = [CacheTag.TRANSACTIONS, CacheTag.TAXES];
    revalidateUserTags('user123', tags);
    
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith('transactions_user123');
    expect(revalidateTag).toHaveBeenCalledWith('taxes_user123');
  });

  it('should handle empty array', () => {
    revalidateUserTags('user123', []);
    
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('should handle single tag', () => {
    revalidateUserTags('user123', [CacheTag.SAVINGS_FUNDS]);
    
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith('savingsFunds_user123');
  });

  it('should handle multiple tags in correct order', () => {
    const tags = [
      CacheTag.TRANSACTIONS,
      CacheTag.TAXES,
      CacheTag.SAVINGS_FUNDS,
      CacheTag.CARD_SUMMARIES,
    ];
    revalidateUserTags('user123', tags);
    
    expect(revalidateTag).toHaveBeenNthCalledWith(1, 'transactions_user123');
    expect(revalidateTag).toHaveBeenNthCalledWith(2, 'taxes_user123');
    expect(revalidateTag).toHaveBeenNthCalledWith(3, 'savingsFunds_user123');
    expect(revalidateTag).toHaveBeenNthCalledWith(4, 'cardSummaries_user123');
  });
});

describe('TagGroups', () => {
  it('should have TRANSACTION_MUTATION group', () => {
    expect(TagGroups.TRANSACTION_MUTATION).toContain(CacheTag.TRANSACTIONS);
    expect(TagGroups.TRANSACTION_MUTATION).toContain(CacheTag.TAXES);
    expect(TagGroups.TRANSACTION_MUTATION).toContain(CacheTag.SAVINGS_FUNDS);
    expect(TagGroups.TRANSACTION_MUTATION).toContain(CacheTag.CARD_SUMMARIES);
    expect(TagGroups.TRANSACTION_MUTATION.length).toBe(4);
  });

  it('should have SAVINGS_FUND_MUTATION group', () => {
    expect(TagGroups.SAVINGS_FUND_MUTATION).toContain(CacheTag.SAVINGS_FUNDS);
    expect(TagGroups.SAVINGS_FUND_MUTATION).toContain(CacheTag.TRANSACTIONS);
    expect(TagGroups.SAVINGS_FUND_MUTATION.length).toBe(2);
  });

  it('should have BILLING_CYCLE_MUTATION group', () => {
    expect(TagGroups.BILLING_CYCLE_MUTATION).toContain(CacheTag.BILLING_CYCLES);
    expect(TagGroups.BILLING_CYCLE_MUTATION).toContain(CacheTag.TRANSACTIONS);
    expect(TagGroups.BILLING_CYCLE_MUTATION.length).toBe(2);
  });

  it('should have USER_DATA_DELETION group with all tags', () => {
    expect(TagGroups.USER_DATA_DELETION.length).toBeGreaterThan(5);
    expect(TagGroups.USER_DATA_DELETION).toContain(CacheTag.TRANSACTIONS);
    expect(TagGroups.USER_DATA_DELETION).toContain(CacheTag.CATEGORIES);
    expect(TagGroups.USER_DATA_DELETION).toContain(CacheTag.PAYMENT_METHODS);
    expect(TagGroups.USER_DATA_DELETION).toContain(CacheTag.SAVINGS_FUNDS);
    expect(TagGroups.USER_DATA_DELETION).toContain(CacheTag.BILLING_CYCLES);
  });

  it('should use TagGroups with revalidateUserTags', () => {
    vi.clearAllMocks();
    
    revalidateUserTags('user123', TagGroups.TRANSACTION_MUTATION);
    
    expect(revalidateTag).toHaveBeenCalledTimes(4);
    expect(revalidateTag).toHaveBeenCalledWith('transactions_user123');
    expect(revalidateTag).toHaveBeenCalledWith('taxes_user123');
    expect(revalidateTag).toHaveBeenCalledWith('savingsFunds_user123');
    expect(revalidateTag).toHaveBeenCalledWith('cardSummaries_user123');
  });
});
