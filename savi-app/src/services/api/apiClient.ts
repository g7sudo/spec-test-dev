import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/core/config/env';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useApiLoadingStore } from '@/state/apiLoadingStore';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and tenant ID, track loading state
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only track mutating requests (POST/PUT/DELETE/PATCH) for the loading overlay.
    // GET requests are typically background fetches from React Query and should NOT
    // block the UI with a loading overlay. This prevents the app from freezing when
    // React Query invalidates queries and triggers background refetches.
    const method = config.method?.toLowerCase();
    const isMutating = method && method !== 'get';
    if (isMutating) {
      useApiLoadingStore.getState().incrementRequest();
    }
    // Tag the request so response interceptors know whether to decrement
    (config as any).__trackLoading = isMutating;

    // Add auth token
    const idToken = useAuthStore.getState().idToken;
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }

    // Handle FormData: React Native's FormData polyfill may not be recognized by axios
    // Note: React Native's FormData is a polyfill that may not pass instanceof check
    // so we also check for the _parts property which is RN's internal FormData structure
    const isFormData = config.data instanceof FormData ||
                       (config.data && typeof config.data === 'object' && '_parts' in config.data);
    if (isFormData) {
      // CRITICAL: Remove the default 'application/json' Content-Type header
      // Axios should automatically set 'multipart/form-data' with boundary when FormData is detected
      // However, React Native's FormData polyfill might not be recognized, so we need to help axios
      if (config.headers['Content-Type'] === 'application/json') {
        // Remove the default JSON Content-Type - axios will set multipart/form-data with boundary
        delete config.headers['Content-Type'];
        // Use AxiosHeaders methods if available
        if (typeof config.headers.set === 'function') {
          config.headers.set('Content-Type', undefined);
        }

        console.log('[API Client] 📎 FormData detected - removed default Content-Type, axios will set multipart/form-data with boundary');
      }
    }

    // Add tenant ID header for tenant-scoped requests
    // Platform endpoints (/v1/platform/*) should NOT have X-Tenant-Id
    // Tenant endpoints (/v1/tenant/*) MUST have X-Tenant-Id header
    // 
    // The tenant ID is persisted in Zustand store (AsyncStorage) via tenantStore
    // and automatically restored on app startup
    const currentTenant = useTenantStore.getState().currentTenant;
    const isPlatformEndpoint = config.url?.startsWith('/v1/platform/');
    const isTenantEndpoint = config.url?.startsWith('/v1/tenant/');
    
    if (isTenantEndpoint) {
      // All /v1/tenant/* endpoints MUST have X-Tenant-Id header
      if (currentTenant?.id) {
        // Automatically add X-Tenant-Id header from persisted tenant store
        config.headers['X-Tenant-Id'] = currentTenant.id;
        console.log('[API Client] 🏢 Added X-Tenant-Id header for tenant endpoint:', {
          endpoint: config.url,
          tenantId: currentTenant.id,
        });
      } else {
        console.warn('[API Client] ⚠️ Tenant endpoint requires X-Tenant-Id but no tenant selected:', {
          endpoint: config.url,
        });
        // Still proceed - backend will return error if tenant ID is required
      }
    } else if (isPlatformEndpoint) {
      // Platform endpoints should NOT have X-Tenant-Id header
      console.log('[API Client] 🌐 Platform endpoint - skipping X-Tenant-Id header:', config.url);
    }

    // Log outgoing request
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log('[API Client] 📤 OUTGOING REQUEST:', {
      method: config.method?.toUpperCase(),
      url: fullUrl,
      baseURL: config.baseURL,
      path: config.url,
      params: config.params,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer ***' : undefined,
      },
      data: config.data,
      timeout: config.timeout,
    });

    return config;
  },
  (error) => {
    console.error('[API Client] ❌ REQUEST ERROR:', {
      message: error.message,
      config: error.config ? {
        url: `${error.config.baseURL || ''}${error.config.url || ''}`,
        method: error.config.method,
      } : null,
      error,
    });
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and track loading state
apiClient.interceptors.response.use(
  (response) => {
    // Only decrement for requests that were tracked (mutating requests)
    if ((response.config as any).__trackLoading) {
      useApiLoadingStore.getState().decrementRequest();
    }

    // Log successful response
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    console.log('[API Client] ✅ INCOMING RESPONSE:', {
      method: response.config.method?.toUpperCase(),
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    // Only decrement for requests that were tracked (mutating requests) - even on error
    if ((error.config as any)?.__trackLoading) {
      useApiLoadingStore.getState().decrementRequest();
    }

    const originalRequest = error.config;
    const fullUrl = originalRequest ? `${originalRequest.baseURL || ''}${originalRequest.url || ''}` : 'unknown';

    // Log error response
    console.error('[API Client] ❌ INCOMING ERROR RESPONSE:', {
      method: originalRequest?.method?.toUpperCase(),
      url: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestHeaders: originalRequest?.headers,
      responseHeaders: error.response?.headers,
      errorMessage: error.message,
      errorCode: error.code,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      config: originalRequest ? {
        baseURL: originalRequest.baseURL,
        url: originalRequest.url,
        params: originalRequest.params,
        data: originalRequest.data,
        timeout: originalRequest.timeout,
      } : null,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('[API Client] 🔐 401 Unauthorized - Clearing auth state');
      // Clear auth state and let the app handle navigation
      useAuthStore.getState().logout();
      useTenantStore.getState().clearTenant();
    }

    // Handle 403 Forbidden (tenant access revoked)
    if (error.response?.status === 403) {
      console.log('[API Client] 🚫 403 Forbidden - Tenant access may be revoked');
      // Could mean tenant access was revoked
      // Let the app handle this based on context
    }

    // Normalize error response
    const normalizedError = {
      status: error.response?.status,
      message: getErrorMessage(error),
      data: error.response?.data,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  }
);

// Helper to extract error message
function getErrorMessage(error: AxiosError): string {
  // Check response data first
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.title) return data.title;
    if (typeof data === 'string') return data;
  }

  // For 401 errors, check www-authenticate header for error details
  if (error.response?.status === 401) {
    const wwwAuthenticate = error.response.headers['www-authenticate'];
    if (wwwAuthenticate) {
      // Extract error_description from www-authenticate header
      // Format: Bearer error="invalid_token", error_description="The token expired at '12/08/2025 20:31:54'"
      const errorDescMatch = wwwAuthenticate.match(/error_description="([^"]+)"/);
      if (errorDescMatch && errorDescMatch[1]) {
        return errorDescMatch[1];
      }

      // Fallback: extract error code
      const errorMatch = wwwAuthenticate.match(/error="([^"]+)"/);
      if (errorMatch && errorMatch[1]) {
        return `Authentication error: ${errorMatch[1]}`;
      }
    }

    return 'Your session has expired. Please sign in again.';
  }

  // For 403 errors, provide specific message
  if (error.response?.status === 403) {
    return 'You do not have permission to access this resource.';
  }

  // Network errors
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Generic fallback
  return 'Something went wrong. Please try again.';
}

export interface ApiError {
  status?: number;
  message: string;
  data?: unknown;
  originalError: AxiosError;
}

export default apiClient;
