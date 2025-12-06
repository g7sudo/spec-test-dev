'use client';

/**
 * Amenity Detail Page
 * Shows amenity details with tabs for Bookings and Blackouts
 * Entry point: /tenant/[tenantSlug]/amenities/[amenityId]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building,
  Loader2,
  ChevronLeft,
  Edit2,
  Calendar,
  CalendarOff,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  User,
  Building2,
  Image as ImageIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AmenityFormDialog,
  BookingDetailDialog,
  BlackoutFormDialog,
  AdminBookingFormDialog,
} from '@/components/amenities';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getAmenityById,
  listBookings,
  listBlackouts,
  deleteBlackout,
} from '@/lib/api/amenities';
import {
  Amenity,
  AmenityBookingSummary,
  AmenityBlackout,
  AmenityBookingStatus,
  DocumentDto,
  getAmenityTypeLabel,
  getAmenityStatusLabel,
  getAmenityStatusColor,
  getBookingStatusLabel,
  getBookingStatusColor,
  formatTime,
  formatDateTime,
  formatDate,
  BOOKING_STATUS_OPTIONS,
} from '@/types/amenity';

// ============================================
// Booking Status Filter Options
// ============================================

const bookingStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  ...BOOKING_STATUS_OPTIONS,
];

// ============================================
// Booking Status Icon
// ============================================

function BookingStatusIcon({ status }: { status: AmenityBookingStatus | string }) {
  switch (status) {
    case AmenityBookingStatus.Approved:
    case 'Approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case AmenityBookingStatus.PendingApproval:
    case 'PendingApproval':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case AmenityBookingStatus.Rejected:
    case 'Rejected':
    case AmenityBookingStatus.Cancelled:
    case 'Cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case AmenityBookingStatus.Completed:
    case 'Completed':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================
// Main Component
// ============================================

export default function AmenityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const amenityId = params.amenityId as string;

  // Refs for preventing double fetches
  const amenityFetchedRef = useRef(false);
  const bookingsFetchedRef = useRef(false);
  const blackoutsFetchedRef = useRef(false);
  // Track previous deps to detect ACTUAL changes (not initial mount)
  const prevBookingsDepsRef = useRef<{ status: string; page: number } | null>(null);

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_AMENITY_VIEW'] === true;
  const canManage = permissions['TENANT_AMENITY_MANAGE'] === true;
  const canApprove = permissions['TENANT_AMENITY_APPROVE_BOOKINGS'] === true;
  const canBook = permissions['TENANT_AMENITY_BOOK'] === true;

  // Amenity state
  const [amenity, setAmenity] = useState<Amenity | null>(null);
  const [isLoadingAmenity, setIsLoadingAmenity] = useState(true);
  const [amenityError, setAmenityError] = useState<string | null>(null);

  // Bookings state
  const [bookings, setBookings] = useState<AmenityBookingSummary[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingsTotalCount, setBookingsTotalCount] = useState(0);

  // Blackouts state
  const [blackouts, setBlackouts] = useState<AmenityBlackout[]>([]);
  const [isLoadingBlackouts, setIsLoadingBlackouts] = useState(true);
  const [blackoutsError, setBlackoutsError] = useState<string | null>(null);

  // Dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showBlackoutDialog, setShowBlackoutDialog] = useState(false);
  const [editingBlackout, setEditingBlackout] = useState<AmenityBlackout | null>(null);
  const [deletingBlackoutId, setDeletingBlackoutId] = useState<string | null>(null);
  const [showAdminBookingDialog, setShowAdminBookingDialog] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('bookings');

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ============================================
  // Load Amenity
  // ============================================

  const loadAmenity = useCallback(
    async (force = false) => {
      if (!canView) return;
      if (!force && amenityFetchedRef.current) return;
      amenityFetchedRef.current = true;

      setIsLoadingAmenity(true);
      setAmenityError(null);

      try {
        const data = await getAmenityById(amenityId);
        setAmenity(data);
      } catch (err) {
        console.error('Failed to load amenity:', err);
        setAmenityError('Failed to load amenity details.');
        amenityFetchedRef.current = false;
      } finally {
        setIsLoadingAmenity(false);
      }
    },
    [canView, amenityId]
  );

  // ============================================
  // Load Bookings
  // ============================================

  const loadBookings = useCallback(
    async (force = false) => {
      if (!canView) return;
      if (!force && bookingsFetchedRef.current) return;
      bookingsFetchedRef.current = true;

      setIsLoadingBookings(true);
      setBookingsError(null);

      try {
        const result = await listBookings({
          amenityId,
          status:
            bookingStatusFilter !== 'all'
              ? (bookingStatusFilter as AmenityBookingStatus)
              : undefined,
          page: bookingsPage,
          pageSize: 10,
        });
        setBookings(result.items);
        setBookingsTotalCount(result.totalCount);
        setBookingsTotalPages(Math.ceil(result.totalCount / 10));
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setBookingsError('Failed to load bookings.');
        bookingsFetchedRef.current = false;
      } finally {
        setIsLoadingBookings(false);
      }
    },
    [canView, amenityId, bookingStatusFilter, bookingsPage]
  );

  // ============================================
  // Load Blackouts
  // ============================================

  const loadBlackouts = useCallback(
    async (force = false) => {
      if (!canView) return;
      if (!force && blackoutsFetchedRef.current) return;
      blackoutsFetchedRef.current = true;

      setIsLoadingBlackouts(true);
      setBlackoutsError(null);

      try {
        const result = await listBlackouts({
          amenityId,
          includePast: false,
          pageSize: 50,
        });
        setBlackouts(result.items);
      } catch (err) {
        console.error('Failed to load blackouts:', err);
        setBlackoutsError('Failed to load blackout periods.');
        blackoutsFetchedRef.current = false;
      } finally {
        setIsLoadingBlackouts(false);
      }
    },
    [canView, amenityId]
  );

  // ============================================
  // Initial Load
  // ============================================

  useEffect(() => {
    loadAmenity();
    loadBookings();
    loadBlackouts();
  }, [loadAmenity, loadBookings, loadBlackouts]);

  // Reload bookings when filter/page ACTUALLY changes (not on initial mount)
  useEffect(() => {
    const currentDeps = { status: bookingStatusFilter, page: bookingsPage };
    
    // Skip initial mount - let the other useEffect handle it
    if (prevBookingsDepsRef.current === null) {
      prevBookingsDepsRef.current = currentDeps;
      return;
    }
    
    // Check if deps actually changed
    const prev = prevBookingsDepsRef.current;
    const changed = prev.status !== currentDeps.status || prev.page !== currentDeps.page;
    
    if (changed) {
      prevBookingsDepsRef.current = currentDeps;
      bookingsFetchedRef.current = false; // Reset guard for actual changes
      loadBookings();
    }
  }, [bookingStatusFilter, bookingsPage, loadBookings]);

  // ============================================
  // Handle Booking Status Filter Change
  // ============================================

  const handleBookingStatusChange = (value: string) => {
    setBookingStatusFilter(value);
    setBookingsPage(1);
  };

  // ============================================
  // Handle Delete Blackout
  // ============================================

  const handleDeleteBlackout = async (blackoutId: string) => {
    setDeletingBlackoutId(blackoutId);
    try {
      await deleteBlackout(blackoutId);
      blackoutsFetchedRef.current = false;
      loadBlackouts(true);
    } catch (err) {
      console.error('Failed to delete blackout:', err);
    } finally {
      setDeletingBlackoutId(null);
    }
  };

  // ============================================
  // Handle Edit Blackout
  // ============================================

  const handleEditBlackout = (blackout: AmenityBlackout) => {
    setEditingBlackout(blackout);
    setShowBlackoutDialog(true);
  };

  // ============================================
  // Handle Blackout Success
  // ============================================

  const handleBlackoutSuccess = () => {
    setEditingBlackout(null);
    blackoutsFetchedRef.current = false;
    loadBlackouts(true);
  };

  // ============================================
  // Handle Amenity Update Success
  // ============================================

  const handleAmenityUpdateSuccess = () => {
    amenityFetchedRef.current = false;
    loadAmenity(true);
  };

  // ============================================
  // Handle Booking Update
  // ============================================

  const handleBookingUpdate = () => {
    bookingsFetchedRef.current = false;
    loadBookings(true);
  };

  // ============================================
  // Handle Admin Booking Success
  // ============================================

  const handleAdminBookingSuccess = () => {
    bookingsFetchedRef.current = false;
    loadBookings(true);
    setActiveTab('bookings');
  };

  // No permission
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Building className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">
          You don&apos;t have permission to view this amenity.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoadingAmenity) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (amenityError || !amenity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {amenityError || 'Amenity not found'}
        </h2>
        <Button
          variant="secondary"
          onClick={() => router.push(`/tenant/${tenantSlug}/amenities`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Amenities
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/tenant/${tenantSlug}/amenities`)}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Amenities
      </Button>

      {/* Amenity Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Icon or Primary Image Thumbnail */}
              {amenity.documents && amenity.documents.length > 0 ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={amenity.documents[0]?.downloadUrl}
                    alt={amenity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Building className="h-8 w-8" />
                </div>
              )}

              {/* Info */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {amenity.name}
                  </h1>
                  {amenity.code && (
                    <span className="text-sm text-gray-400">({amenity.code})</span>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${getAmenityStatusColor(
                      amenity.status
                    )}`}
                  >
                    {getAmenityStatusLabel(amenity.status)}
                  </span>
                </div>

                <p className="text-gray-500 mt-1">
                  {getAmenityTypeLabel(amenity.type)}
                  {amenity.locationText && ` • ${amenity.locationText}`}
                </p>

                {amenity.description && (
                  <p className="text-sm text-gray-600 mt-2">{amenity.description}</p>
                )}

                {/* Key Settings */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  {amenity.isBookable ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Bookable
                    </span>
                  ) : (
                    <span className="text-gray-400">Not bookable</span>
                  )}

                  {amenity.isBookable && (
                    <>
                      {amenity.requiresApproval && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-4 w-4" />
                          Requires Approval
                        </span>
                      )}

                      <span className="text-gray-500">
                        {formatTime(amenity.openTime)} - {formatTime(amenity.closeTime)}
                      </span>

                      <span className="text-gray-500">
                        {amenity.slotDurationMinutes} min slots
                      </span>

                      {amenity.depositRequired && amenity.depositAmount && (
                        <span className="text-gray-500">
                          Deposit: ${amenity.depositAmount.toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {canManage && (
              <Button variant="secondary" onClick={() => setShowEditDialog(true)}>
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Bookings & Blackouts */}
      <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bookings" icon={<Calendar className="h-4 w-4" />}>
            Bookings
          </TabsTrigger>
          <TabsTrigger value="blackouts" icon={<CalendarOff className="h-4 w-4" />}>
            Blackout Periods
          </TabsTrigger>
          <TabsTrigger value="gallery" icon={<ImageIcon className="h-4 w-4" />}>
            Gallery
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader
              title="Bookings"
              description={
                isLoadingBookings
                  ? 'Loading...'
                  : `${bookingsTotalCount} booking${
                      bookingsTotalCount !== 1 ? 's' : ''
                    } found`
              }
              action={
                <div className="flex items-center gap-3">
                  {canBook && amenity.isBookable && (
                    <Button
                      size="sm"
                      onClick={() => setShowAdminBookingDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Book for Resident
                    </Button>
                  )}
                  <div className="w-48">
                    <Select
                      value={bookingStatusFilter}
                      onValueChange={handleBookingStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : bookingsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
                  <p className="text-red-600">{bookingsError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      bookingsFetchedRef.current = false;
                      loadBookings(true);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {bookingStatusFilter !== 'all'
                      ? 'No bookings match your filter'
                      : 'No bookings yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {bookings.map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
                      onClick={() => setSelectedBookingId(booking.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Icon */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <BookingStatusIcon status={booking.status} />
                        </div>

                        {/* Booking Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {booking.title || 'Booking'}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getBookingStatusColor(
                                booking.status
                              )}`}
                            >
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {/* Date/Time */}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateTime(booking.startAt)}
                            </span>

                            {/* Unit */}
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              Unit {booking.unitNumber}
                            </span>

                            {/* Booked By */}
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {booking.bookedForUserName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {bookingsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-gray-500">
                    Page {bookingsPage} of {bookingsTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={bookingsPage <= 1}
                      onClick={() => setBookingsPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={bookingsPage >= bookingsTotalPages}
                      onClick={() => setBookingsPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blackouts Tab */}
        <TabsContent value="blackouts">
          <Card>
            <CardHeader
              title="Blackout Periods"
              description="Dates when this amenity is unavailable for booking"
              action={
                canManage && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingBlackout(null);
                      setShowBlackoutDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Blackout
                  </Button>
                )
              }
            />
            <CardContent>
              {isLoadingBlackouts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : blackoutsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
                  <p className="text-red-600">{blackoutsError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      blackoutsFetchedRef.current = false;
                      loadBlackouts(true);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : blackouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarOff className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No upcoming blackout periods</p>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setEditingBlackout(null);
                        setShowBlackoutDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add First Blackout
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {blackouts.map((blackout) => (
                    <div
                      key={blackout.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                          <CalendarOff className="h-5 w-5" />
                        </div>

                        {/* Info */}
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(blackout.startDate)} -{' '}
                            {formatDate(blackout.endDate)}
                          </p>
                          {blackout.reason && (
                            <p className="text-sm text-gray-500">{blackout.reason}</p>
                          )}
                          {blackout.autoCancelBookings && (
                            <p className="text-xs text-amber-600 mt-1">
                              Auto-cancels overlapping bookings
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBlackout(blackout)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteBlackout(blackout.id)}
                            disabled={deletingBlackoutId === blackout.id}
                          >
                            {deletingBlackoutId === blackout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader
              title="Gallery"
              description={
                amenity.documents && amenity.documents.length > 0
                  ? `${amenity.documents.length} image${amenity.documents.length !== 1 ? 's' : ''}`
                  : 'No images uploaded'
              }
              action={
                canManage && (
                  <Button
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                    Manage Images
                  </Button>
                )
              }
            />
            <CardContent>
              {amenity.documents && amenity.documents.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={amenity.documents[selectedImageIndex]?.downloadUrl}
                      alt={amenity.documents[selectedImageIndex]?.fileName || amenity.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation arrows for multiple images */}
                    {amenity.documents.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                          onClick={() => setSelectedImageIndex((prev) => 
                            prev === 0 ? amenity.documents.length - 1 : prev - 1
                          )}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                          onClick={() => setSelectedImageIndex((prev) => 
                            prev === amenity.documents.length - 1 ? 0 : prev + 1
                          )}
                        >
                          <ChevronRightIcon className="h-6 w-6" />
                        </button>
                      </>
                    )}

                    {/* Image counter */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {selectedImageIndex + 1} / {amenity.documents.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {amenity.documents.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {amenity.documents.map((doc, index) => (
                        <button
                          key={doc.id}
                          type="button"
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === selectedImageIndex
                              ? 'border-primary-500'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.downloadUrl}
                            alt={doc.fileName}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No images uploaded yet</p>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Images
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Amenity Dialog */}
      <AmenityFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        amenity={amenity}
        onSuccess={handleAmenityUpdateSuccess}
      />

      {/* Booking Detail Dialog */}
      <BookingDetailDialog
        open={!!selectedBookingId}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
        bookingId={selectedBookingId}
        canApprove={canApprove}
        canManage={canManage}
        onUpdate={handleBookingUpdate}
      />

      {/* Blackout Form Dialog */}
      <BlackoutFormDialog
        open={showBlackoutDialog}
        onOpenChange={(open) => {
          setShowBlackoutDialog(open);
          if (!open) setEditingBlackout(null);
        }}
        amenityId={amenityId}
        amenityName={amenity.name}
        blackout={editingBlackout}
        onSuccess={handleBlackoutSuccess}
      />

      {/* Admin Booking Form Dialog */}
      <AdminBookingFormDialog
        open={showAdminBookingDialog}
        onOpenChange={setShowAdminBookingDialog}
        amenity={amenity}
        onSuccess={handleAdminBookingSuccess}
      />
    </div>
  );
}

