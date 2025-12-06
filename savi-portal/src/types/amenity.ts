/**
 * Amenity Module Types
 * Types for Amenities, Bookings, and Blackouts
 * Maps to backend DTOs from Savi.Application.Tenant.Amenities
 */

// Re-export PagedResult from http.ts to avoid duplication
export { PagedResult } from './http';

// Re-export TempUploadResponse from profile.ts to avoid duplication
export { TempUploadResponse } from './profile';

// ============================================
// Document Types for Amenity Images
// ============================================

/**
 * Action state for managing documents
 */
export enum DocumentActionState {
  Active = 'Active',
  Deleted = 'Deleted',
}

/**
 * Document/Image attached to an amenity
 */
export interface DocumentDto {
  id: string;
  fileName: string;
  title: string | null;
  description: string | null;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
  category: string;
  displayOrder: number;
  actionState: DocumentActionState | string;
  createdAt: string;
}

/**
 * Document management DTO for update requests
 * Used to update metadata or mark documents as deleted
 */
export interface DocumentManagementDto {
  id: string;
  actionState?: DocumentActionState;
  title?: string | null;
  description?: string | null;
  displayOrder?: number;
}

// ============================================
// Enums (values match C# enum strings)
// ============================================

/**
 * Type of amenity (e.g., Party Hall, Tennis Court, etc.)
 */
export enum AmenityType {
  PartyHall = 'PartyHall',
  TennisCourt = 'TennisCourt',
  SwimmingPool = 'SwimmingPool',
  Gym = 'Gym',
  Clubhouse = 'Clubhouse',
  BarbecueArea = 'BarbecueArea',
  MeetingRoom = 'MeetingRoom',
  GuestRoom = 'GuestRoom',
  PlayArea = 'PlayArea',
  Theater = 'Theater',
  Other = 'Other',
}

/**
 * Status of an amenity
 */
export enum AmenityStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  UnderMaintenance = 'UnderMaintenance',
  Closed = 'Closed',
}

/**
 * Status of an amenity booking
 */
export enum AmenityBookingStatus {
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  NoShow = 'NoShow',
}

/**
 * Source of a booking
 */
export enum AmenityBookingSource {
  MobileApp = 'MobileApp',
  AdminPortal = 'AdminPortal',
  FrontDesk = 'FrontDesk',
}

/**
 * Status of deposit for a booking
 */
export enum AmenityDepositStatus {
  NotRequired = 'NotRequired',
  Pending = 'Pending',
  Paid = 'Paid',
  Refunded = 'Refunded',
  Forfeited = 'Forfeited',
}

// ============================================
// Amenity DTOs
// ============================================

/**
 * Amenity summary for list views
 */
export interface AmenitySummary {
  id: string;
  name: string;
  code: string | null;
  type: AmenityType | string;
  status: AmenityStatus | string;
  locationText: string | null;
  isBookable: boolean;
  requiresApproval: boolean;
  depositRequired: boolean;
  depositAmount: number | null;
  displayOrder: number;
  isAvailableForBooking: boolean;
}

/**
 * Full amenity details
 */
export interface Amenity {
  id: string;
  name: string;
  code: string | null;
  type: AmenityType | string;
  status: AmenityStatus | string;
  description: string | null;
  locationText: string | null;
  isVisibleInApp: boolean;
  displayOrder: number;
  isBookable: boolean;
  requiresApproval: boolean;
  slotDurationMinutes: number;
  openTime: string | null; // "HH:mm" format
  closeTime: string | null; // "HH:mm" format
  cleanupBufferMinutes: number;
  maxDaysInAdvance: number;
  maxActiveBookingsPerUnit: number | null;
  maxGuests: number | null;
  depositRequired: boolean;
  depositAmount: number | null;
  isAvailableForBooking: boolean;
  isActive: boolean;
  createdAt: string;
  /** Attached images/documents (displayOrder=0 is primary) */
  documents: DocumentDto[];
}

/**
 * Create amenity request
 */
export interface CreateAmenityRequest {
  name: string;
  code?: string | null;
  type: AmenityType;
  status?: AmenityStatus;
  description?: string | null;
  locationText?: string | null;
  isVisibleInApp?: boolean;
  displayOrder?: number;
  isBookable?: boolean;
  requiresApproval?: boolean;
  slotDurationMinutes?: number;
  openTime?: string | null;
  closeTime?: string | null;
  cleanupBufferMinutes?: number;
  maxDaysInAdvance?: number;
  maxActiveBookingsPerUnit?: number | null;
  maxGuests?: number | null;
  depositRequired?: boolean;
  depositAmount?: number | null;
  /** Temp keys for uploaded images to attach */
  tempDocuments?: string[] | null;
}

/**
 * Update amenity request
 */
export interface UpdateAmenityRequest {
  name: string;
  code?: string | null;
  type: AmenityType;
  status: AmenityStatus;
  description?: string | null;
  locationText?: string | null;
  isVisibleInApp: boolean;
  displayOrder: number;
  isBookable: boolean;
  requiresApproval: boolean;
  slotDurationMinutes: number;
  openTime?: string | null;
  closeTime?: string | null;
  cleanupBufferMinutes: number;
  maxDaysInAdvance: number;
  maxActiveBookingsPerUnit?: number | null;
  maxGuests?: number | null;
  depositRequired: boolean;
  depositAmount?: number | null;
  /** Existing documents to update/delete */
  documents?: DocumentManagementDto[] | null;
  /** Temp keys for new images to attach */
  tempDocuments?: string[] | null;
}

// ============================================
// Availability DTOs
// ============================================

/**
 * A single time slot for availability
 */
export interface TimeSlot {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isAvailable: boolean;
  unavailableReason: string | null;
}

/**
 * Availability for an amenity on a specific date
 */
export interface AmenityAvailability {
  amenityId: string;
  amenityName: string;
  date: string; // "YYYY-MM-DD"
  availableSlots: TimeSlot[];
  isBlackoutDate: boolean;
  blackoutReason: string | null;
}

// ============================================
// Booking DTOs
// ============================================

/**
 * Booking summary for list views
 */
export interface AmenityBookingSummary {
  id: string;
  amenityId: string;
  amenityName: string;
  unitNumber: string;
  bookedForUserName: string;
  startAt: string;
  endAt: string;
  status: AmenityBookingStatus | string;
  source: AmenityBookingSource | string;
  title: string | null;
  numberOfGuests: number | null;
  depositStatus: AmenityDepositStatus | string;
}

/**
 * Full booking details
 */
export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  unitId: string;
  unitNumber: string;
  blockName: string | null;
  bookedForUserId: string;
  bookedForUserName: string;
  startAt: string;
  endAt: string;
  status: AmenityBookingStatus | string;
  source: AmenityBookingSource | string;
  title: string | null;
  notes: string | null;
  adminNotes: string | null;
  numberOfGuests: number | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  approvedByUserName: string | null;
  rejectedAt: string | null;
  rejectedByUserId: string | null;
  rejectedByUserName: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancelledByUserId: string | null;
  cancelledByUserName: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
  depositRequired: boolean;
  depositAmount: number | null;
  depositStatus: AmenityDepositStatus | string;
  depositReference: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create booking request
 */
export interface CreateBookingRequest {
  amenityId: string;
  unitId: string;
  bookedForUserId: string;
  startAt: string;
  endAt: string;
  /** Booking source - AdminPortal when admin books for resident */
  source?: AmenityBookingSource;
  title?: string | null;
  notes?: string | null;
  numberOfGuests?: number | null;
}

/**
 * Approve booking request
 */
export interface ApproveBookingRequest {
  adminNotes?: string | null;
}

/**
 * Reject booking request
 */
export interface RejectBookingRequest {
  reason: string;
}

/**
 * Cancel booking request
 */
export interface CancelBookingRequest {
  reason?: string | null;
  isAdminCancellation?: boolean;
}

/**
 * Update deposit status request
 */
export interface UpdateDepositStatusRequest {
  newStatus: AmenityDepositStatus;
  reference?: string | null;
}

// ============================================
// Blackout DTOs
// ============================================

/**
 * Blackout period for an amenity
 */
export interface AmenityBlackout {
  id: string;
  amenityId: string;
  amenityName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  reason: string | null;
  autoCancelBookings: boolean;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create blackout request
 */
export interface CreateBlackoutRequest {
  amenityId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  reason?: string | null;
  autoCancelBookings?: boolean;
}

/**
 * Update blackout request
 */
export interface UpdateBlackoutRequest {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  reason?: string | null;
  autoCancelBookings?: boolean;
}

// ============================================
// List Query Params
// ============================================

export interface ListAmenitiesParams {
  type?: AmenityType;
  status?: AmenityStatus;
  isBookable?: boolean;
  isVisibleInApp?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface ListBookingsParams {
  amenityId?: string;
  unitId?: string;
  status?: AmenityBookingStatus;
  fromDate?: string; // "YYYY-MM-DD"
  toDate?: string; // "YYYY-MM-DD"
  page?: number;
  pageSize?: number;
}

export interface ListBlackoutsParams {
  amenityId?: string;
  fromDate?: string; // "YYYY-MM-DD"
  toDate?: string; // "YYYY-MM-DD"
  includePast?: boolean;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for amenity type
 */
export function getAmenityTypeLabel(type: AmenityType | string): string {
  switch (type) {
    case AmenityType.PartyHall:
    case 'PartyHall':
      return 'Party Hall';
    case AmenityType.TennisCourt:
    case 'TennisCourt':
      return 'Tennis Court';
    case AmenityType.SwimmingPool:
    case 'SwimmingPool':
      return 'Swimming Pool';
    case AmenityType.Gym:
    case 'Gym':
      return 'Gym';
    case AmenityType.Clubhouse:
    case 'Clubhouse':
      return 'Clubhouse';
    case AmenityType.BarbecueArea:
    case 'BarbecueArea':
      return 'Barbecue Area';
    case AmenityType.MeetingRoom:
    case 'MeetingRoom':
      return 'Meeting Room';
    case AmenityType.GuestRoom:
    case 'GuestRoom':
      return 'Guest Room';
    case AmenityType.PlayArea:
    case 'PlayArea':
      return 'Play Area';
    case AmenityType.Theater:
    case 'Theater':
      return 'Theater';
    case AmenityType.Other:
    case 'Other':
      return 'Other';
    default:
      return type || 'Unknown';
  }
}

/**
 * Gets display label for amenity status
 */
export function getAmenityStatusLabel(status: AmenityStatus | string): string {
  switch (status) {
    case AmenityStatus.Active:
    case 'Active':
      return 'Active';
    case AmenityStatus.Inactive:
    case 'Inactive':
      return 'Inactive';
    case AmenityStatus.UnderMaintenance:
    case 'UnderMaintenance':
      return 'Under Maintenance';
    case AmenityStatus.Closed:
    case 'Closed':
      return 'Closed';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes for amenity status
 */
export function getAmenityStatusColor(status: AmenityStatus | string): string {
  switch (status) {
    case AmenityStatus.Active:
    case 'Active':
      return 'bg-green-100 text-green-700';
    case AmenityStatus.Inactive:
    case 'Inactive':
      return 'bg-gray-100 text-gray-600';
    case AmenityStatus.UnderMaintenance:
    case 'UnderMaintenance':
      return 'bg-yellow-100 text-yellow-700';
    case AmenityStatus.Closed:
    case 'Closed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for booking status
 */
export function getBookingStatusLabel(status: AmenityBookingStatus | string): string {
  switch (status) {
    case AmenityBookingStatus.PendingApproval:
    case 'PendingApproval':
      return 'Pending Approval';
    case AmenityBookingStatus.Approved:
    case 'Approved':
      return 'Approved';
    case AmenityBookingStatus.Rejected:
    case 'Rejected':
      return 'Rejected';
    case AmenityBookingStatus.Cancelled:
    case 'Cancelled':
      return 'Cancelled';
    case AmenityBookingStatus.Completed:
    case 'Completed':
      return 'Completed';
    case AmenityBookingStatus.NoShow:
    case 'NoShow':
      return 'No Show';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes for booking status
 */
export function getBookingStatusColor(status: AmenityBookingStatus | string): string {
  switch (status) {
    case AmenityBookingStatus.PendingApproval:
    case 'PendingApproval':
      return 'bg-amber-100 text-amber-700';
    case AmenityBookingStatus.Approved:
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case AmenityBookingStatus.Rejected:
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    case AmenityBookingStatus.Cancelled:
    case 'Cancelled':
      return 'bg-gray-100 text-gray-600';
    case AmenityBookingStatus.Completed:
    case 'Completed':
      return 'bg-blue-100 text-blue-700';
    case AmenityBookingStatus.NoShow:
    case 'NoShow':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for deposit status
 */
export function getDepositStatusLabel(status: AmenityDepositStatus | string): string {
  switch (status) {
    case AmenityDepositStatus.NotRequired:
    case 'NotRequired':
      return 'Not Required';
    case AmenityDepositStatus.Pending:
    case 'Pending':
      return 'Pending';
    case AmenityDepositStatus.Paid:
    case 'Paid':
      return 'Paid';
    case AmenityDepositStatus.Refunded:
    case 'Refunded':
      return 'Refunded';
    case AmenityDepositStatus.Forfeited:
    case 'Forfeited':
      return 'Forfeited';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes for deposit status
 */
export function getDepositStatusColor(status: AmenityDepositStatus | string): string {
  switch (status) {
    case AmenityDepositStatus.NotRequired:
    case 'NotRequired':
      return 'bg-gray-100 text-gray-600';
    case AmenityDepositStatus.Pending:
    case 'Pending':
      return 'bg-amber-100 text-amber-700';
    case AmenityDepositStatus.Paid:
    case 'Paid':
      return 'bg-green-100 text-green-700';
    case AmenityDepositStatus.Refunded:
    case 'Refunded':
      return 'bg-blue-100 text-blue-700';
    case AmenityDepositStatus.Forfeited:
    case 'Forfeited':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for booking source
 */
export function getBookingSourceLabel(source: AmenityBookingSource | string): string {
  switch (source) {
    case AmenityBookingSource.MobileApp:
    case 'MobileApp':
      return 'Mobile App';
    case AmenityBookingSource.AdminPortal:
    case 'AdminPortal':
      return 'Admin Portal';
    case AmenityBookingSource.FrontDesk:
    case 'FrontDesk':
      return 'Front Desk';
    default:
      return source || 'Unknown';
  }
}

/**
 * Formats a time string (HH:mm) for display
 */
export function formatTime(time: string | null): string {
  if (!time) return '-';
  
  // Parse HH:mm and format to 12-hour format
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats a date-time string for display
 */
export function formatDateTime(dateTime: string | null): string {
  if (!dateTime) return '-';
  
  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date string for display
 */
export function formatDate(date: string | null): string {
  if (!date) return '-';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * All amenity type options for select dropdowns
 */
export const AMENITY_TYPE_OPTIONS = [
  { value: AmenityType.PartyHall, label: 'Party Hall' },
  { value: AmenityType.TennisCourt, label: 'Tennis Court' },
  { value: AmenityType.SwimmingPool, label: 'Swimming Pool' },
  { value: AmenityType.Gym, label: 'Gym' },
  { value: AmenityType.Clubhouse, label: 'Clubhouse' },
  { value: AmenityType.BarbecueArea, label: 'Barbecue Area' },
  { value: AmenityType.MeetingRoom, label: 'Meeting Room' },
  { value: AmenityType.GuestRoom, label: 'Guest Room' },
  { value: AmenityType.PlayArea, label: 'Play Area' },
  { value: AmenityType.Theater, label: 'Theater' },
  { value: AmenityType.Other, label: 'Other' },
];

/**
 * All amenity status options for select dropdowns
 */
export const AMENITY_STATUS_OPTIONS = [
  { value: AmenityStatus.Active, label: 'Active' },
  { value: AmenityStatus.Inactive, label: 'Inactive' },
  { value: AmenityStatus.UnderMaintenance, label: 'Under Maintenance' },
  { value: AmenityStatus.Closed, label: 'Closed' },
];

/**
 * All booking status options for select dropdowns
 */
export const BOOKING_STATUS_OPTIONS = [
  { value: AmenityBookingStatus.PendingApproval, label: 'Pending Approval' },
  { value: AmenityBookingStatus.Approved, label: 'Approved' },
  { value: AmenityBookingStatus.Rejected, label: 'Rejected' },
  { value: AmenityBookingStatus.Cancelled, label: 'Cancelled' },
  { value: AmenityBookingStatus.Completed, label: 'Completed' },
  { value: AmenityBookingStatus.NoShow, label: 'No Show' },
];

/**
 * Deposit status options for select dropdowns
 */
export const DEPOSIT_STATUS_OPTIONS = [
  { value: AmenityDepositStatus.NotRequired, label: 'Not Required' },
  { value: AmenityDepositStatus.Pending, label: 'Pending' },
  { value: AmenityDepositStatus.Paid, label: 'Paid' },
  { value: AmenityDepositStatus.Refunded, label: 'Refunded' },
  { value: AmenityDepositStatus.Forfeited, label: 'Forfeited' },
];
