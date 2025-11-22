import { ObjectId } from 'mongodb';

/**
 * Custom error class for validation errors.
 * 
 * Used to distinguish validation errors from other types of errors
 * in server actions, allowing for more specific error handling.
 * 
 * @example
 * ```typescript
 * throw new ValidationError('User not authenticated.');
 * ```
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a user is authenticated by checking if userId is provided.
 * 
 * This is a type assertion function that narrows the type from
 * `string | undefined | null` to `string` if validation passes.
 * 
 * @param userId - The user ID to validate (typically from session)
 * @throws {ValidationError} If userId is empty, undefined, or null
 * 
 * @example
 * ```typescript
 * // In a server action
 * export async function getCategories(userId: string | undefined) {
 *   validateUserId(userId); // Throws if invalid
 *   // TypeScript now knows userId is string
 *   const categories = await db.collection('categories').find({ userId }).toArray();
 * }
 * ```
 */
export function validateUserId(userId: string | undefined | null): asserts userId is string {
  if (!userId) {
    throw new ValidationError('User not authenticated.');
  }
}

/**
 * Validates that a string is a valid MongoDB ObjectId.
 * 
 * Checks if the provided ID matches MongoDB's ObjectId format
 * (24 character hexadecimal string).
 * 
 * @param id - The ID string to validate
 * @param fieldName - Optional custom field name for error message (default: 'ID')
 * @throws {ValidationError} If the ID is not a valid MongoDB ObjectId
 * 
 * @example
 * ```typescript
 * validateObjectId('507f1f77bcf86cd799439011'); // OK
 * validateObjectId('invalid'); // Throws: "Invalid ID."
 * validateObjectId('invalid', 'category ID'); // Throws: "Invalid category ID."
 * ```
 */
export function validateObjectId(id: string, fieldName = 'ID'): void {
  if (!ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${fieldName}.`);
  }
}

/**
 * Validates that a required field has a value.
 * 
 * This is a type assertion function that narrows the type from
 * `T | undefined | null` to `T` if validation passes.
 * 
 * @template T - The type of the value being validated
 * @param value - The value to validate
 * @param fieldName - The field name for error message
 * @throws {ValidationError} If value is undefined, null, or empty string
 * 
 * @example
 * ```typescript
 * function createCategory(name: string | undefined, color: string | undefined) {
 *   validateRequired(name, 'name');
 *   validateRequired(color, 'color');
 *   // TypeScript now knows both are strings
 *   return { name, color };
 * }
 * ```
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
 * Validates both userId and ObjectId in a single call.
 * 
 * Common pattern used across many server actions that need to verify
 * both user authentication and resource ID validity.
 * 
 * @param userId - The user ID to validate (typically from session)
 * @param id - The resource ID to validate (e.g., category ID, transaction ID)
 * @param fieldName - Optional custom field name for ObjectId error message (default: 'ID')
 * @throws {ValidationError} If userId is invalid or id is not a valid ObjectId
 * 
 * @example
 * ```typescript
 * export async function deleteCategory(id: string, userId: string | undefined) {
 *   validateUserAndId(userId, id, 'category ID');
 *   // Both validations passed, safe to proceed
 *   await db.collection('categories').deleteOne({ _id: new ObjectId(id), userId });
 * }
 * ```
 */
export function validateUserAndId(
  userId: string | undefined | null,
  id: string,
  fieldName = 'ID'
): void {
  validateUserId(userId);
  validateObjectId(id, fieldName);
}
