import { describe, it, expect } from 'vitest';
import {
  INSTALLMENT_PATTERN,
  parseInstallmentDescription,
  formatInstallmentDescription,
  isInstallmentDescription,
  getBaseDescription,
} from './installment-helpers';

describe('INSTALLMENT_PATTERN', () => {
  it('should match valid installment descriptions', () => {
    expect(INSTALLMENT_PATTERN.test('Purchase (1/12)')).toBe(true);
    expect(INSTALLMENT_PATTERN.test('Monthly Payment (5/10)')).toBe(true);
    expect(INSTALLMENT_PATTERN.test('Item (10/24)')).toBe(true);
  });

  it('should not match invalid descriptions', () => {
    expect(INSTALLMENT_PATTERN.test('Purchase')).toBe(false);
    expect(INSTALLMENT_PATTERN.test('Purchase (Cuota 1/12)')).toBe(false);
    expect(INSTALLMENT_PATTERN.test('Purchase [1/12]')).toBe(false);
    expect(INSTALLMENT_PATTERN.test('Purchase 1/12')).toBe(false);
  });
});

describe('parseInstallmentDescription', () => {
  it('should parse valid installment description', () => {
    const result = parseInstallmentDescription('Purchase (3/12)');
    
    expect(result).toEqual({
      baseDescription: 'Purchase',
      current: 3,
      total: 12,
    });
  });

  it('should handle descriptions with spaces', () => {
    const result = parseInstallmentDescription('Monthly Payment (1/6)');
    
    expect(result).toEqual({
      baseDescription: 'Monthly Payment',
      current: 1,
      total: 6,
    });
  });

  it('should handle double digit numbers', () => {
    const result = parseInstallmentDescription('Item (10/24)');
    
    expect(result).toEqual({
      baseDescription: 'Item',
      current: 10,
      total: 24,
    });
  });

  it('should return null for invalid description', () => {
    expect(parseInstallmentDescription('Purchase')).toBeNull();
    expect(parseInstallmentDescription('Purchase (Cuota 1/12)')).toBeNull();
    expect(parseInstallmentDescription('')).toBeNull();
  });

  it('should trim whitespace from base description', () => {
    const result = parseInstallmentDescription('  Purchase  (2/10)');
    expect(result?.baseDescription).toBe('Purchase');
  });

  it('should handle edge case numbers', () => {
    const result1 = parseInstallmentDescription('Item (1/1)');
    expect(result1).toEqual({ baseDescription: 'Item', current: 1, total: 1 });
    
    const result2 = parseInstallmentDescription('Item (99/99)');
    expect(result2).toEqual({ baseDescription: 'Item', current: 99, total: 99 });
  });
});

describe('formatInstallmentDescription', () => {
  it('should format installment description correctly', () => {
    const result = formatInstallmentDescription('Purchase', 1, 12);
    expect(result).toBe('Purchase (1/12)');
  });

  it('should handle multi-word descriptions', () => {
    const result = formatInstallmentDescription('Monthly Payment', 5, 10);
    expect(result).toBe('Monthly Payment (5/10)');
  });

  it('should handle single digit numbers', () => {
    const result = formatInstallmentDescription('Item', 1, 3);
    expect(result).toBe('Item (1/3)');
  });

  it('should handle double digit numbers', () => {
    const result = formatInstallmentDescription('Item', 10, 24);
    expect(result).toBe('Item (10/24)');
  });

  it('should handle descriptions with special characters', () => {
    const result = formatInstallmentDescription('Item & Service', 2, 6);
    expect(result).toBe('Item & Service (2/6)');
  });
});

describe('isInstallmentDescription', () => {
  it('should return true for valid installment descriptions', () => {
    expect(isInstallmentDescription('Purchase (1/12)')).toBe(true);
    expect(isInstallmentDescription('Payment (5/10)')).toBe(true);
    expect(isInstallmentDescription('Item (10/24)')).toBe(true);
  });

  it('should return false for invalid descriptions', () => {
    expect(isInstallmentDescription('Purchase')).toBe(false);
    expect(isInstallmentDescription('Purchase (Cuota 1/12)')).toBe(false);
    expect(isInstallmentDescription('')).toBe(false);
    expect(isInstallmentDescription('Purchase [1/12]')).toBe(false);
  });
});

describe('getBaseDescription', () => {
  it('should extract base description from installment description', () => {
    const result = getBaseDescription('Purchase (3/12)');
    expect(result).toBe('Purchase');
  });

  it('should handle multi-word descriptions', () => {
    const result = getBaseDescription('Monthly Payment (5/10)');
    expect(result).toBe('Monthly Payment');
  });

  it('should return original description if not installment format', () => {
    const result = getBaseDescription('Regular Purchase');
    expect(result).toBe('Regular Purchase');
  });

  it('should handle empty string', () => {
    const result = getBaseDescription('');
    expect(result).toBe('');
  });

  it('should handle descriptions with special characters', () => {
    const result = getBaseDescription('Item & Service (2/6)');
    expect(result).toBe('Item & Service');
  });
});

describe('Integration: parse and format', () => {
  it('should be reversible', () => {
    const original = 'Purchase (5/12)';
    const parsed = parseInstallmentDescription(original);
    
    expect(parsed).not.toBeNull();
    
    const formatted = formatInstallmentDescription(
      parsed!.baseDescription,
      parsed!.current,
      parsed!.total
    );
    
    expect(formatted).toBe(original);
  });

  it('should work with complex descriptions', () => {
    const original = 'Monthly Subscription Payment (10/24)';
    const parsed = parseInstallmentDescription(original);
    
    expect(parsed).not.toBeNull();
    
    const formatted = formatInstallmentDescription(
      parsed!.baseDescription,
      parsed!.current,
      parsed!.total
    );
    
    expect(formatted).toBe(original);
  });
});
