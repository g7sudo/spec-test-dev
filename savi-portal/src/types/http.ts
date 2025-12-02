/**
 * HTTP client types for API communication
 * Defines error types and response structures
 */

// ============================================
// Error Types
// ============================================

/**
 * Base API error class with typed error info
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 401 Unauthorized - invalid or expired token
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Your session has expired', public reason?: 'ExpiredToken' | 'InvalidToken') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden - valid token but no permission
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found - resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'The requested resource was not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

/**
 * 400/422 Validation Error - invalid request data
 */
export class ValidationError extends ApiError {
  constructor(message: string, public fieldErrors?: Record<string, string[]>) {
    super(400, 'VALIDATION_ERROR', message, { fieldErrors });
    this.name = 'ValidationError';
  }
}

/**
 * 500+ Server Error - backend issues
 */
export class ServerError extends ApiError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, 'SERVER_ERROR', message);
    this.name = 'ServerError';
  }
}

/**
 * Network Error - couldn't reach server
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Unable to connect to the server') {
    super(0, 'NETWORK_ERROR', message);
    this.name = 'NetworkError';
  }
}

// ============================================
// Response Types
// ============================================

/**
 * Paginated response wrapper matching backend PagedResult
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Problem Details response from backend (RFC 7807)
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

