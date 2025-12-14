import { useState, useCallback, useMemo } from 'react';
import { AnnouncementSummaryDto } from '@/services/api/announcements';
import { VisitorPassSummaryDto } from '@/services/api/visitors';
import { useAnnouncementsFeed } from '@/features/announcements/hooks';
import { useMyVisitors } from '@/features/visitors/hooks';

// ============================================================================
// Types - Mock data types that will be replaced with real API types later
// ============================================================================

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
}

interface HouseholdMember {
  id: string;
  name: string;
  photoUrl?: string;
  isNew?: boolean;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  requestDate: string;
  requestTime: string;
  category: string;
  status: 'New' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled' | 'Rejected';
}

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  discount?: string;
  ctaText: string;
  imageUrl?: string;
  gradientColors: string[];
}

interface FeaturedOffer {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText: string;
}

interface HomeData {
  bill: Bill | null;
  householdMembers: HouseholdMember[];
  /** Visitors from API (real data - today + pending) */
  visitors: VisitorPassSummaryDto[];
  /** Loading state for visitors */
  isLoadingVisitors: boolean;
  /** Error state for visitors */
  visitorsError: Error | null;
  maintenanceRequests: MaintenanceRequest[];
  /** Announcements from API (real data) */
  announcements: AnnouncementSummaryDto[];
  /** Total count of announcements for "View more" indicator */
  announcementsTotalCount: number;
  /** Loading state for announcements */
  isLoadingAnnouncements: boolean;
  /** Error state for announcements */
  announcementsError: Error | null;
  promoBanner: PromoBanner | null;
  featuredOffers: FeaturedOffer[];
  unreadNotifications: number;
  unreadAnnouncements: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// Mock Data - For demonstration, will be replaced with real API calls
// ============================================================================

const mockBill: Bill = {
  id: 'bill-1',
  title: 'Electricity Bill',
  amount: 2500,
  dueDate: '20 Sep 2025',
  isOverdue: false,
};

const mockHouseholdMembers: HouseholdMember[] = [
  { id: '1', name: 'John Doe', photoUrl: 'https://picsum.photos/200/200?random=1' },
  { id: '2', name: 'Jane Doe', photoUrl: 'https://picsum.photos/200/200?random=2' },
  { id: '3', name: 'Mike Doe', photoUrl: 'https://picsum.photos/200/200?random=3', isNew: true },
  { id: '4', name: 'Sarah Doe', photoUrl: 'https://picsum.photos/200/200?random=4' },
];

const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 'm1',
    title: 'Leaking Bathroom Faucet',
    requestDate: 'Sept 23',
    requestTime: '10:00 AM',
    category: 'Plumber',
    status: 'New',
  },
  {
    id: 'm2',
    title: 'AC Not Cooling',
    requestDate: 'Sept 22',
    requestTime: '03:00 PM',
    category: 'AC Tech',
    status: 'Completed',
  },
];

const mockPromoBanner: PromoBanner = {
  id: 'promo-1',
  title: 'Tandoori Nights @ Spinache!',
  subtitle: 'Weekend Special',
  discount: 'Flat 20% OFF',
  ctaText: 'Order Now',
  gradientColors: ['#7B2D8E', '#E91E63'],
};

const mockFeaturedOffers: FeaturedOffer[] = [
  {
    id: 'offer-1',
    title: '"Where Every Day Says You Vacation"',
    subtitle: 'A serene apartment living that truly matters for the community',
    imageUrl: 'https://picsum.photos/400/300?random=8',
    ctaText: 'Book Now',
  },
  {
    id: 'offer-2',
    title: '"Your Dream Home Awaits"',
    subtitle: 'Premium amenities and world-class facilities',
    imageUrl: 'https://picsum.photos/400/300?random=9',
    ctaText: 'Book Now',
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useHomeData - Hook for fetching all home screen data
 * 
 * Fetches:
 * - Announcements (real API via React Query)
 * - Other data (mock data for now, to be replaced with real APIs)
 */
export const useHomeData = (): HomeData => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch announcements from API (limit to 10 for home screen preview)
  const {
    data: announcementsData,
    isLoading: isLoadingAnnouncements,
    error: announcementsError,
    refetch: refetchAnnouncements,
  } = useAnnouncementsFeed({ pageSize: 10 });

  // Calculate date filters for visitors (today + upcoming/pending)
  const visitorsFilters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      fromDate: today.toISOString(), // From today onwards (includes today + future)
      page: 1,
      pageSize: 10,
    };
  }, []);

  // Fetch visitors from API (today + pending)
  const {
    data: visitorsData,
    isLoading: isLoadingVisitors,
    error: visitorsError,
    refetch: refetchVisitors,
  } = useMyVisitors(visitorsFilters);

  // Extract visitors from paginated response and sort by date
  const visitors = useMemo(() => {
    if (!visitorsData?.items) return [];
    // Sort by expected date (earliest first)
    return [...visitorsData.items].sort((a, b) => 
      new Date(a.expectedFrom).getTime() - new Date(b.expectedFrom).getTime()
    );
  }, [visitorsData?.items]);

  // Extract announcements from paginated response
  const announcements = useMemo(() => {
    return announcementsData?.items || [];
  }, [announcementsData?.items]);

  const announcementsTotalCount = announcementsData?.totalCount || 0;

  // Calculate unread announcements count
  const unreadAnnouncements = useMemo(() => {
    return announcements.filter(a => !a.hasRead).length;
  }, [announcements]);

  // Mock data - In production, these would come from API calls using React Query
  const [bill] = useState<Bill | null>(mockBill);
  const [householdMembers] = useState<HouseholdMember[]>(mockHouseholdMembers);
  const [maintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [promoBanner] = useState<PromoBanner | null>(mockPromoBanner);
  const [featuredOffers] = useState<FeaturedOffer[]>(mockFeaturedOffers);
  const [unreadNotifications] = useState(3);

  // Refetch all data
  const refetch = useCallback(() => {
    setIsLoading(true);
    
    // Refetch announcements and visitors
    refetchAnnouncements();
    refetchVisitors();
    
    // Simulate API call for mock data
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [refetchAnnouncements, refetchVisitors]);

  return {
    bill,
    householdMembers,
    // Visitors (real data from API)
    visitors,
    isLoadingVisitors,
    visitorsError: visitorsError || null,
    maintenanceRequests,
    // Announcements (real data from API)
    announcements,
    announcementsTotalCount,
    isLoadingAnnouncements,
    announcementsError: announcementsError || null,
    // Other mock data
    promoBanner,
    featuredOffers,
    unreadNotifications,
    unreadAnnouncements,
    isLoading: isLoading || isLoadingAnnouncements || isLoadingVisitors,
    error,
    refetch,
  };
};

export default useHomeData;
