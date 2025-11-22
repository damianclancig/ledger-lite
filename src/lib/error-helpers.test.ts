import { describe, it, expect, vi } from 'vitest';
import {
  DatabaseError,
  handleActionError,
  withDatabaseErrorHandling,
  isErrorResponse,
} from './error-helpers';
import { ValidationError } from './validation-helpers';

describe('DatabaseError', () => {
  it('should create a DatabaseError with correct properties', () => {
    const originalError = new Error('Original error');
    const dbError = new DatabaseError('Database failed', originalError);
    
    expect(dbError).toBeInstanceOf(Error);
    expect(dbError.name).toBe('DatabaseError');
    expect(dbError.message).toBe('Database failed');
    expect(dbError.originalError).toBe(originalError);
  });

  it('should work without original error', () => {
    const dbError = new DatabaseError('Database failed');
    
    expect(dbError.message).toBe('Database failed');
    expect(dbError.originalError).toBeUndefined();
  });
});

describe('handleActionError', () => {
  it('should handle ValidationError', () => {
    const error = new ValidationError('Invalid input');
    const result = handleActionError(error, 'create user');
    
    expect(result).toEqual({ error: 'Invalid input' });
  });

  it('should handle DatabaseError', () => {
    const error = new DatabaseError('Connection failed');
    const result = handleActionError(error, 'fetch data');
    
    expect(result).toEqual({ error: 'Failed to fetch data. Connection failed' });
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');
    const result = handleActionError(error, 'process request');
    
    expect(result).toEqual({ error: 'Failed to process request. Something went wrong' });
  });

  it('should handle unknown error types', () => {
    const error = 'String error';
    const result = handleActionError(error, 'unknown operation');
    
    expect(result).toEqual({ error: 'Failed to unknown operation. An unknown error occurred' });
  });

  it('should handle number errors', () => {
    const error = 404;
    const result = handleActionError(error, 'test');
    
    expect(result).toEqual({ error: 'Failed to test. An unknown error occurred' });
  });

  it('should log errors to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    
    handleActionError(error, 'test');
    
    expect(consoleSpy).toHaveBeenCalledWith('Error test:', error);
    consoleSpy.mockRestore();
  });
});

describe('withDatabaseErrorHandling', () => {
  it('should return result on success', async () => {
    const operation = async () => 'success';
    const result = await withDatabaseErrorHandling(operation, 'test error');
    
    expect(result).toBe('success');
  });

  it('should return complex objects on success', async () => {
    const operation = async () => ({ id: '123', name: 'Test' });
    const result = await withDatabaseErrorHandling(operation, 'test error');
    
    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('should throw DatabaseError on failure', async () => {
    const operation = async () => {
      throw new Error('Original error');
    };
    
    await expect(
      withDatabaseErrorHandling(operation, 'Operation failed')
    ).rejects.toThrow(DatabaseError);
    
    await expect(
      withDatabaseErrorHandling(operation, 'Operation failed')
    ).rejects.toThrow('Operation failed');
  });

  it('should preserve original error in DatabaseError', async () => {
    const originalError = new Error('Original error');
    const operation = async () => {
      throw originalError;
    };
    
    try {
      await withDatabaseErrorHandling(operation, 'Operation failed');
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError);
      expect((error as DatabaseError).originalError).toBe(originalError);
    }
  });
});

describe('isErrorResponse', () => {
  it('should return true for error response', () => {
    const response = { error: 'Something went wrong' };
    expect(isErrorResponse(response)).toBe(true);
  });

  it('should return true for error response with other properties', () => {
    const response = { error: 'Error', code: 500 };
    expect(isErrorResponse(response)).toBe(true);
  });

  it('should return false for success response', () => {
    const response = { id: '123', name: 'Test' };
    expect(isErrorResponse(response)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isErrorResponse(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isErrorResponse(undefined)).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(isErrorResponse({})).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isErrorResponse([])).toBe(false);
    expect(isErrorResponse([{ error: 'test' }])).toBe(false);
  });
});
