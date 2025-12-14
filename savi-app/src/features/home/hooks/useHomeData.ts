import { useState, useCallback, useMemo } from 'react';
import { AnnouncementSummaryDto } from '@/services/api/announcements';
import { useAnnouncementsFeed } from '@/features/announcements/hooks';

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

interface Visitor {
  id: string;
  name: string;
  flatNumber: string;
  visitDate: string;
  visitTime: string;
  photoUrl?: string;
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
  visitors: Visitor[];
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

const mockVisitors: Visitor[] = [
  {
    id: 'v1',
    name: 'Dr. John Doe',
    flatNumber: '203',
    visitDate: 'Wed 10',
    visitTime: '10:00 AM',
    photoUrl: 'https://picsum.photos/200/200?random=5',
  },
  {
    id: 'v2',
    name: 'Shella',
    flatNumber: '203',
    visitDate: 'Wed 10',
    visitTime: '10:00 AM',
    photoUrl: 'https://picsum.photos/200/200?random=6',
  },
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
  const [visitors] = useState<Visitor[]>(mockVisitors);
  const [maintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [promoBanner] = useState<PromoBanner | null>(mockPromoBanner);
  const [featuredOffers] = useState<FeaturedOffer[]>(mockFeaturedOffers);
  const [unreadNotifications] = useState(3);

  // Refetch all data
  const refetch = useCallback(() => {
    setIsLoading(true);
    
    // Refetch announcements
    refetchAnnouncements();
    
    // Simulate API call for mock data
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [refetchAnnouncements]);

  return {
    bill,
    householdMembers,
    visitors,
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
    isLoading: isLoading || isLoadingAnnouncements,
    error,
    refetch,
  };
};

export default useHomeData;
