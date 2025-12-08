import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time - how long to keep inactive data in cache
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch options
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: false,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    mobileConfig: ['auth', 'mobileConfig'] as const,
  },

  // Profile
  profile: {
    my: ['profile', 'my'] as const,
  },

  // Maintenance
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.maintenance.lists(), filters] as const,
    myRequests: (filters?: Record<string, unknown>) =>
      [...queryKeys.maintenance.all, 'myRequests', filters] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
    categories: ['maintenance', 'categories'] as const,
  },

  // Visitors
  visitors: {
    all: ['visitors'] as const,
    lists: () => [...queryKeys.visitors.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.visitors.lists(), filters] as const,
    details: () => [...queryKeys.visitors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.visitors.details(), id] as const,
  },

  // Amenities
  amenities: {
    all: ['amenities'] as const,
    lists: () => [...queryKeys.amenities.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.amenities.lists(), filters] as const,
    details: () => [...queryKeys.amenities.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.amenities.details(), id] as const,
    availability: (id: string, date: string) =>
      [...queryKeys.amenities.all, 'availability', id, date] as const,
    bookings: {
      all: ['amenityBookings'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.amenities.bookings.all, 'list', filters] as const,
      detail: (id: string) =>
        [...queryKeys.amenities.bookings.all, 'detail', id] as const,
    },
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    feed: (filters?: Record<string, unknown>) =>
      [...queryKeys.announcements.all, 'feed', filters] as const,
    detail: (id: string) => [...queryKeys.announcements.all, 'detail', id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, 'list', filters] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },

  // Community
  community: {
    units: {
      all: ['units'] as const,
      detail: (id: string) => ['units', 'detail', id] as const,
      parties: (unitId: string) => ['units', unitId, 'parties'] as const,
    },
  },

  // Ads
  ads: {
    banners: (params: Record<string, unknown>) => ['ads', 'banners', params] as const,
    stories: (tenantId: string) => ['ads', 'stories', tenantId] as const,
  },
} as const;
