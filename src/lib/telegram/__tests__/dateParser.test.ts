import { parseDateExpression, formatDateForDisplay } from '../dateParser';

describe('parseDateExpression', () => {
  const referenceDate = new Date('2025-11-26T10:00:00-03:00'); // Tuesday, Nov 26, 2025

  test('should parse "hoy" as today', () => {
    const result = parseDateExpression('hoy', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(26);
    expect(result?.getMonth()).toBe(10); // November (0-indexed)
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getHours()).toBe(0);
  });

  test('should parse "ayer" as yesterday', () => {
    const result = parseDateExpression('ayer', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(25);
    expect(result?.getMonth()).toBe(10);
  });

  test('should parse "anteayer" as day before yesterday', () => {
    const result = parseDateExpression('anteayer', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(24);
    expect(result?.getMonth()).toBe(10);
  });

  test('should parse "el lunes" as last Monday', () => {
    const result = parseDateExpression('el lunes', referenceDate);
    expect(result).not.toBeNull();
    // Reference is Tuesday Nov 26, so last Monday is Nov 25
    expect(result?.getDate()).toBe(25);
    expect(result?.getDay()).toBe(1); // Monday
  });

  test('should parse "el martes" as today (Tuesday)', () => {
    const result = parseDateExpression('el martes', referenceDate);
    expect(result).not.toBeNull();
    // Reference is Tuesday, but we go back to previous Tuesday (7 days)
    expect(result?.getDate()).toBe(19);
    expect(result?.getDay()).toBe(2); // Tuesday
  });

  test('should parse "hace 3 días"', () => {
    const result = parseDateExpression('hace 3 días', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(23);
    expect(result?.getMonth()).toBe(10);
  });

  test('should parse "hace una semana"', () => {
    const result = parseDateExpression('hace una semana', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(19);
    expect(result?.getMonth()).toBe(10);
  });

  test('should parse "el 15" as 15th of current month', () => {
    const result = parseDateExpression('el 15', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(10); // November
  });

  test('should parse "el día 20"', () => {
    const result = parseDateExpression('el día 20', referenceDate);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(20);
    expect(result?.getMonth()).toBe(10);
  });

  test('should return null for invalid input', () => {
    const result = parseDateExpression('invalid date', referenceDate);
    expect(result).toBeNull();
  });

  test('should handle empty string', () => {
    const result = parseDateExpression('', referenceDate);
    expect(result).toBeNull();
  });
});

describe('formatDateForDisplay', () => {
  test('should format today as "Hoy"', () => {
    const today = new Date();
    const result = formatDateForDisplay(today);
    expect(result).toBe('Hoy');
  });

  test('should format yesterday with date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDateForDisplay(yesterday);
    expect(result).toContain('Ayer');
    expect(result).toContain(yesterday.getDate().toString());
  });

  test('should format other dates with day name', () => {
    const date = new Date('2025-11-20T00:00:00'); // Thursday
    const result = formatDateForDisplay(date);
    expect(result).toContain('20');
    expect(result).toContain('11');
  });
});
