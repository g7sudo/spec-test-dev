import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/core/config/env';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and tenant ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const idToken = useAuthStore.getState().idToken;
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }

    // Add tenant ID header for tenant-scoped requests
    const currentTenant = useTenantStore.getState().currentTenant;
    if (currentTenant && !config.url?.startsWith('/platform/')) {
      config.headers['X-Tenant-Id'] = currentTenant.id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth state and let the app handle navigation
      useAuthStore.getState().logout();
      useTenantStore.getState().clearTenant();
    }

    // Handle 403 Forbidden (tenant access revoked)
    if (error.response?.status === 403) {
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
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.title) return data.title;
    if (typeof data === 'string') return data;
  }

  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

export interface ApiError {
  status?: number;
  message: string;
  data?: unknown;
  originalError: AxiosError;
}

export default apiClient;
