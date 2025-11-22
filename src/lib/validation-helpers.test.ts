import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  validateUserId,
  validateObjectId,
  validateRequired,
  validateUserAndId,
} from './validation-helpers';

describe('ValidationError', () => {
  it('should create a ValidationError with correct name', () => {
    const error = new ValidationError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test error');
  });
});

describe('validateUserId', () => {
  it('should not throw for valid userId', () => {
    expect(() => validateUserId('user123')).not.toThrow();
  });

  it('should throw ValidationError for undefined userId', () => {
    expect(() => validateUserId(undefined)).toThrow(ValidationError);
    expect(() => validateUserId(undefined)).toThrow('User not authenticated.');
  });

  it('should throw ValidationError for null userId', () => {
    expect(() => validateUserId(null)).toThrow(ValidationError);
  });

  it('should throw ValidationError for empty string userId', () => {
    expect(() => validateUserId('')).toThrow(ValidationError);
  });
});

describe('validateObjectId', () => {
  it('should not throw for valid ObjectId', () => {
    expect(() => validateObjectId('507f1f77bcf86cd799439011')).not.toThrow();
    expect(() => validateObjectId('507f191e810c19729de860ea')).not.toThrow();
  });

  it('should throw ValidationError for invalid ObjectId', () => {
    expect(() => validateObjectId('invalid')).toThrow(ValidationError);
    expect(() => validateObjectId('invalid')).toThrow('Invalid ID.');
  });

  it('should use custom field name in error message', () => {
    expect(() => validateObjectId('invalid', 'category ID')).toThrow('Invalid category ID.');
    expect(() => validateObjectId('xyz', 'transaction ID')).toThrow('Invalid transaction ID.');
  });

  it('should throw for empty string', () => {
    expect(() => validateObjectId('')).toThrow(ValidationError);
  });

  it('should throw for too short string', () => {
    expect(() => validateObjectId('123')).toThrow(ValidationError);
  });
});

describe('validateRequired', () => {
  it('should not throw for valid value', () => {
    expect(() => validateRequired('value', 'field')).not.toThrow();
    expect(() => validateRequired(123, 'number')).not.toThrow();
    expect(() => validateRequired(true, 'boolean')).not.toThrow();
    expect(() => validateRequired(false, 'boolean')).not.toThrow();
    expect(() => validateRequired(0, 'zero')).not.toThrow();
  });

  it('should throw for undefined', () => {
    expect(() => validateRequired(undefined, 'field')).toThrow('field is required.');
  });

  it('should throw for null', () => {
    expect(() => validateRequired(null, 'field')).toThrow('field is required.');
  });

  it('should throw for empty string', () => {
    expect(() => validateRequired('', 'field')).toThrow('field is required.');
  });
});

describe('validateUserAndId', () => {
  it('should not throw for valid userId and ObjectId', () => {
    expect(() => validateUserAndId('user123', '507f1f77bcf86cd799439011')).not.toThrow();
  });

  it('should throw for invalid userId', () => {
    expect(() => validateUserAndId(undefined, '507f1f77bcf86cd799439011')).toThrow('User not authenticated.');
  });

  it('should throw for invalid ObjectId', () => {
    expect(() => validateUserAndId('user123', 'invalid')).toThrow('Invalid ID.');
  });

  it('should use custom field name', () => {
    expect(() => validateUserAndId('user123', 'invalid', 'transaction ID')).toThrow('Invalid transaction ID.');
  });

  it('should validate userId before ObjectId', () => {
    // Should throw userId error first, not ObjectId error
    expect(() => validateUserAndId(null, 'invalid')).toThrow('User not authenticated.');
  });
});
