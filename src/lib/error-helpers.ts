import { ValidationError } from './validation-helpers';

/**
 * Custom error class for database-related errors.
 * 
 * Wraps database operation errors with additional context,
 * preserving the original error for debugging purposes.
 * 
 * @example
 * ```typescript
 * try {
 *   await db.collection('users').insertOne(user);
 * } catch (error) {
 *   throw new DatabaseError('Failed to create user', error);
 * }
 * ```
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Standardized error response type for server actions.
 * 
 * All server actions should return this type when an error occurs,
 * ensuring consistent error handling across the application.
 */
export type ErrorResponse = { error: string };

/**
 * Handles errors in server actions with consistent logging and formatting.
 * 
 * Automatically logs errors to console and formats them into a standardized
 * ErrorResponse object. Handles different error types appropriately:
 * - ValidationError: Returns validation message directly
 * - DatabaseError: Prefixes with "Failed to {operation}"
 * - Generic Error: Extracts error message
 * - Unknown types: Returns generic error message
 * 
 * @param error - The caught error (can be any type)
 * @param operation - Description of the operation that failed (e.g., "add category", "fetch transactions")
 * @returns Formatted error response object with user-friendly message
 * 
 * @example
 * ```typescript
 * export async function addCategory(data: CategoryData, userId: string) {
 *   try {
 *     validateUserId(userId);
 *     // ... database operations
 *     return category;
 *   } catch (error) {
 *     return handleActionError(error, 'add category');
 *     // Returns: { error: "Failed to add category. Connection timeout" }
 *   }
 * }
 * ```
 */
export function handleActionError(
  error: unknown,
  operation: string
): ErrorResponse {
  console.error(`Error ${operation}:`, error);
  
  // Handle known error types
  if (error instanceof ValidationError) {
    return { error: error.message };
  }
  
  if (error instanceof DatabaseError) {
    return { error: `Failed to ${operation}. ${error.message}` };
  }
  
  // Handle generic errors
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unknown error occurred';
    
  return { error: `Failed to ${operation}. ${errorMessage}` };
}

/**
 * Wraps a database operation with standardized error handling.
 * 
 * Converts any errors thrown during the operation into DatabaseError instances,
 * providing consistent error tracking and handling across database operations.
 * 
 * @template T - The return type of the database operation
 * @param operation - Async function containing the database operation
 * @param errorMessage - Error message to use if operation fails
 * @returns The result of the operation if successful
 * @throws {DatabaseError} If the operation fails
 * 
 * @example
 * ```typescript
 * const user = await withDatabaseErrorHandling(
 *   async () => {
 *     const result = await db.collection('users').findOne({ _id: userId });
 *     if (!result) throw new Error('User not found');
 *     return result;
 *   },
 *   'Failed to fetch user'
 * );
 * ```
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Type guard to check if a response is an error response.
 * 
 * Useful for discriminating between success and error responses
 * in server actions that can return either a result or an error.
 * 
 * @template T - The type of the success response
 * @param response - The response to check (can be success, error, null, or undefined)
 * @returns True if response is an ErrorResponse, false otherwise
 * 
 * @example
 * ```typescript
 * const result = await addCategory(data, userId);
 * 
 * if (isErrorResponse(result)) {
 *   // TypeScript knows result is { error: string }
 *   toast.error(result.error);
 *   return;
 * }
 * 
 * // TypeScript knows result is Category
 * toast.success(`Category ${result.name} created`);
 * ```
 */
export function isErrorResponse<T>(
  response: T | ErrorResponse | null | undefined
): response is ErrorResponse {
  return response != null && (response as ErrorResponse).error !== undefined;
}
