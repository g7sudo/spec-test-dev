/**
 * HTTP Client for SAVI Portal
 * Centralized fetch wrapper with auth, error handling, and type safety
 * Supports X-Tenant-Id header for tenant-scoped requests
 */

import { API_BASE_URL } from '@/config/env';
import { mapResponseToError, createNetworkError } from './errors';
import { UnauthorizedError } from '@/types/http';

// ============================================
// Types
// ============================================

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  // Skip auth token attachment
  skipAuth?: boolean;
  // Tenant ID for X-Tenant-Id header (for tenant-scoped requests)
  tenantId?: string | null;
}

type TokenGetter = () => Promise<string | null>;
type TenantIdGetter = () => string | null;

// ============================================
// Client State
// ============================================

// Token getter function - set by auth provider
let getToken: TokenGetter = async () => null;

// Tenant ID getter function - set by scope provider
let getTenantId: TenantIdGetter = () => null;

// Session expiry callback - set by session provider
let onSessionExpired: (() => void) | null = null;

/**
 * Sets the token getter function (called by auth provider)
 */
export function setTokenGetter(getter: TokenGetter): void {
  getToken = getter;
}

/**
 * Sets the tenant ID getter function (called by scope provider)
 */
export function setTenantIdGetter(getter: TenantIdGetter): void {
  getTenantId = getter;
}

/**
 * Sets the session expiry callback (called by session provider)
 */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

// ============================================
// HTTP Client
// ============================================

/**
 * Core HTTP client with auth and error handling
 * All API calls should go through this
 */
export const httpClient = {
  /**
   * GET request
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
  },

  /**
   * PUT request
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'PUT', body });
  },

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },

  /**
   * PATCH request
   */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },

  /**
   * POST request with FormData (for file uploads)
   * Content-Type is automatically set by browser to multipart/form-data
   */
  async postFormData<T>(path: string, formData: FormData, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return requestFormData<T>(path, { ...options, method: 'POST' }, formData);
  },
};

/**
 * Core request function with auth and error handling
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, tenantId, headers: customHeaders, ...fetchOptions } = options;

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Attach auth token if available and not skipped
  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Attach X-Tenant-Id header if in tenant scope
  // Use explicit tenantId from options, or fall back to global getter
  const effectiveTenantId = tenantId !== undefined ? tenantId : getTenantId();
  if (effectiveTenantId) {
    (headers as Record<string, string>)['X-Tenant-Id'] = effectiveTenantId;
  }

  // Build full URL
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle errors
    if (!response.ok) {
      const error = await mapResponseToError(response);
      
      // Trigger session expired handler for 401s
      if (error instanceof UnauthorizedError && onSessionExpired) {
        onSessionExpired();
      }
      
      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse JSON response
    return response.json();
  } catch (error) {
    // Re-throw specific API errors
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    // Optionally, add other API error types here, e.g. ApiError
    // if (error instanceof ApiError) {
    //   throw error;
    // }
    // Wrap all other errors as network errors
    throw createNetworkError(error);
  }
}

/**
 * FormData request function for file uploads
 * Does NOT set Content-Type (browser automatically sets multipart/form-data with boundary)
 */
async function requestFormData<T>(
  path: string, 
  options: Omit<RequestOptions, 'body'> = {},
  formData: FormData
): Promise<T> {
  const { skipAuth, tenantId, headers: customHeaders, ...fetchOptions } = options;

  // Build headers - DO NOT set Content-Type for FormData
  // Browser automatically sets multipart/form-data with correct boundary
  const headers: Record<string, string> = {};
  
  // Copy custom headers if any
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'content-type') { // Skip Content-Type
        headers[key] = value as string;
      }
    });
  }

  // Attach auth token if available and not skipped
  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Attach X-Tenant-Id header if in tenant scope
  const effectiveTenantId = tenantId !== undefined ? tenantId : getTenantId();
  if (effectiveTenantId) {
    headers['X-Tenant-Id'] = effectiveTenantId;
  }

  // Build full URL
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: formData,
    });

    // Handle errors
    if (!response.ok) {
      const error = await mapResponseToError(response);
      
      // Trigger session expired handler for 401s
      if (error instanceof UnauthorizedError && onSessionExpired) {
        onSessionExpired();
      }
      
      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse JSON response
    return response.json();
  } catch (error) {
    // Re-throw specific API errors
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    // Wrap all other errors as network errors
    throw createNetworkError(error);
  }
}

export default httpClient;
