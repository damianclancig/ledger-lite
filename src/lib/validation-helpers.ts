import { ObjectId } from 'mongodb';

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a user ID is provided
 * @throws {ValidationError} if userId is empty or undefined
 */
export function validateUserId(userId: string | undefined | null): asserts userId is string {
  if (!userId) {
    throw new ValidationError('User not authenticated.');
  }
}

/**
 * Validates that an ObjectId is valid
 * @throws {ValidationError} if the ID is not a valid MongoDB ObjectId
 */
export function validateObjectId(id: string, fieldName = 'ID'): void {
  if (!ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${fieldName}.`);
  }
}

/**
 * Validates that a required field is provided
 * @throws {ValidationError} if the value is empty, undefined, or null
 */
export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string
): asserts value is T {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
}

/**
 * Validates both userId and ObjectId in one call
 * Common pattern used across many action functions
 */
export function validateUserAndId(
  userId: string | undefined | null,
  id: string,
  fieldName = 'ID'
): void {
  validateUserId(userId);
  validateObjectId(id, fieldName);
}
