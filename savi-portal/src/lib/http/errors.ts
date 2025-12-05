/**
 * HTTP Error mapping utilities
 * Maps HTTP responses to typed error classes
 */

import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ServerError,
  NetworkError,
  ProblemDetails,
} from '@/types/http';

/**
 * Maps an HTTP response to the appropriate error type
 * Supports both RFC 7807 ProblemDetails and simple { error: "..." } format
 */
export async function mapResponseToError(response: Response): Promise<ApiError> {
  const status = response.status;
  
  // Try to parse error body
  let problemDetails: ProblemDetails | null = null;
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      problemDetails = await response.json();
    }
  } catch {
    // Ignore parse errors, use default messages
  }
  
  // Extract message from various formats:
  // - ProblemDetails: { detail: "...", title: "..." }
  // - Simple error: { error: "..." }
  // - Message field: { message: "..." }
  const message = 
    problemDetails?.detail || 
    problemDetails?.title || 
    (problemDetails as Record<string, unknown>)?.error as string ||
    (problemDetails as Record<string, unknown>)?.message as string ||
    response.statusText;
  
  // Map to appropriate error type
  switch (status) {
    case 401:
    case 419: // Session expired
      return new UnauthorizedError(message, 'ExpiredToken');
      
    case 403:
      return new ForbiddenError(message);
      
    case 404:
      return new NotFoundError(message);
      
    case 400:
    case 422:
      // Extract field errors if present
      const fieldErrors = problemDetails?.errors as Record<string, string[]> | undefined;
      return new ValidationError(message, fieldErrors);
      
    default:
      if (status >= 500) {
        return new ServerError(message);
      }
      return new ApiError(status, 'UNKNOWN_ERROR', message);
  }
}

/**
 * Creates a NetworkError for fetch failures
 */
export function createNetworkError(error: unknown): NetworkError {
  const message = error instanceof Error 
    ? error.message 
    : 'Unable to connect to the server';
  return new NetworkError(message);
}

/**
 * Gets a user-friendly message for an error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

