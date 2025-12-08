import { useState, useCallback, useEffect } from 'react';

// Mock data types - these will be replaced with real API types
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

interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorPhotoUrl?: string;
  content: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
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
  feedPosts: FeedPost[];
  promoBanner: PromoBanner | null;
  featuredOffers: FeaturedOffer[];
  unreadNotifications: number;
  unreadAnnouncements: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Mock data for demonstration
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

const mockFeedPosts: FeedPost[] = [
  {
    id: 'f1',
    authorName: 'Security',
    authorRole: 'Admin',
    authorPhotoUrl: 'https://picsum.photos/200/200?random=7',
    content:
      'Water supply will be interrupted on Sunday from 8 AM to 12 PM for maintenance work. Please store water in advance.',
    timestamp: '10 minutes ago',
    likeCount: 10,
    commentCount: 3,
    isLiked: true,
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

export const useHomeData = (): HomeData => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In production, these would come from API calls using React Query
  const [bill] = useState<Bill | null>(mockBill);
  const [householdMembers] = useState<HouseholdMember[]>(mockHouseholdMembers);
  const [visitors] = useState<Visitor[]>(mockVisitors);
  const [maintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [feedPosts] = useState<FeedPost[]>(mockFeedPosts);
  const [promoBanner] = useState<PromoBanner | null>(mockPromoBanner);
  const [featuredOffers] = useState<FeaturedOffer[]>(mockFeaturedOffers);
  const [unreadNotifications] = useState(3);
  const [unreadAnnouncements] = useState(2);

  const refetch = useCallback(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return {
    bill,
    householdMembers,
    visitors,
    maintenanceRequests,
    feedPosts,
    promoBanner,
    featuredOffers,
    unreadNotifications,
    unreadAnnouncements,
    isLoading,
    error,
    refetch,
  };
};

export default useHomeData;
