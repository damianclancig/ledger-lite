import { ValidationError } from './validation-helpers';

/**
 * Custom error class for database-related errors
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Standardized error response type for server actions
 */
export type ErrorResponse = { error: string };

/**
 * Handles errors in server actions with consistent logging and formatting
 * @param error - The caught error
 * @param operation - Description of the operation that failed (e.g., "add category")
 * @returns Formatted error response object
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
 * Wraps a database operation with error handling
 * Converts generic errors to DatabaseError for better error tracking
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
 * Type guard to check if a response is an error
 */
export function isErrorResponse<T>(
  response: T | ErrorResponse | null | undefined
): response is ErrorResponse {
  return response != null && (response as ErrorResponse).error !== undefined;
}
