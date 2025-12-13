/**
 * Amenities API Service
 * 
 * Handles amenity-related API calls including listing, details, availability, and bookings.
 */

import apiClient from './apiClient';

/**
 * Amenity Type enum matching backend
 */
export enum AmenityType {
  PartyHall = 'PartyHall',
  Court = 'Court',
  MeetingRoom = 'MeetingRoom',
  BBQArea = 'BBQArea',
  GymRoom = 'GymRoom',
  Other = 'Other',
}

/**
 * Amenity Status enum matching backend
 */
export enum AmenityStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  UnderMaintenance = 'UnderMaintenance',
}

/**
 * Amenity Booking Status enum matching backend
 */
export enum AmenityBookingStatus {
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  CancelledByResident = 'CancelledByResident',
  CancelledByAdmin = 'CancelledByAdmin',
  Completed = 'Completed',
  NoShow = 'NoShow',
}

/**
 * Paginated result structure matching backend PagedResult<T>
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
 * Document DTO for amenity images/documents
 */
export interface DocumentDto {
  documentId: string;
  fileName: string;
  contentType: string;
  downloadUrl: string;
  sizeBytes: number;
}

/**
 * Amenity Summary DTO for list views
 * Response from GET /v1/tenant/amenities
 */
export interface AmenitySummaryDto {
  id: string;
  name: string;
  code: string | null;
  type: AmenityType;
  status: AmenityStatus;
  locationText: string | null;
  isBookable: boolean;
  requiresApproval: boolean;
  depositRequired: boolean;
  depositAmount: number | null;
  displayOrder: number;
  isAvailableForBooking: boolean;
  primaryImageUrl: string | null; // Falls back to placeholder if null
}

/**
 * Amenity Detail DTO
 * Response from GET /v1/tenant/amenities/{id}
 */
export interface AmenityDto {
  id: string;
  name: string;
  code: string | null;
  type: AmenityType;
  status: AmenityStatus;
  description: string | null;
  locationText: string | null;
  isVisibleInApp: boolean;
  displayOrder: number;
  isBookable: boolean;
  requiresApproval: boolean;
  slotDurationMinutes: number;
  openTime: string | null; // TimeOnly format "HH:mm:ss"
  closeTime: string | null; // TimeOnly format "HH:mm:ss"
  cleanupBufferMinutes: number;
  maxDaysInAdvance: number;
  maxActiveBookingsPerUnit: number | null;
  maxGuests: number | null;
  depositRequired: boolean;
  depositAmount: number | null;
  isAvailableForBooking: boolean;
  documents: DocumentDto[];
  isActive: boolean;
  createdAt: string;
}

/**
 * Available Slot DTO for availability response
 */
export interface AvailableSlotDto {
  startTime: string; // TimeOnly format "HH:mm:ss"
  endTime: string; // TimeOnly format "HH:mm:ss"
  isAvailable: boolean;
  unavailableReason: string | null;
}

/**
 * Amenity Availability DTO
 * Response from GET /v1/tenant/amenities/{id}/availability?date=YYYY-MM-DD
 */
export interface AmenityAvailabilityDto {
  amenityId: string;
  amenityName: string;
  date: string; // DateOnly format "YYYY-MM-DD"
  availableSlots: AvailableSlotDto[];
  isBlackoutDate: boolean;
  blackoutReason: string | null;
}

/**
 * Amenity Booking Summary DTO for list views
 * Response from GET /v1/tenant/me/bookings
 */
export interface AmenityBookingSummaryDto {
  id: string;
  amenityId: string;
  amenityName: string;
  unitNumber: string;
  bookedForUserName: string;
  startAt: string; // ISO 8601 datetime
  endAt: string; // ISO 8601 datetime
  status: AmenityBookingStatus;
  source: string; // AmenityBookingSource enum
  title: string | null;
  numberOfGuests: number | null;
  depositStatus: string; // AmenityDepositStatus enum
}

/**
 * Filters for listing amenities
 */
export interface ListAmenitiesFilters {
  type?: AmenityType;
  status?: AmenityStatus;
  isBookable?: boolean;
  isVisibleInApp?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filters for listing bookings
 */
export interface ListBookingsFilters {
  amenityId?: string;
  status?: AmenityBookingStatus;
  fromDate?: string; // DateOnly format "YYYY-MM-DD"
  toDate?: string; // DateOnly format "YYYY-MM-DD"
  page?: number;
  pageSize?: number;
}

/**
 * Gets a list of all amenities with optional filtering and pagination.
 * 
 * Backend Endpoint: GET /api/v1/tenant/amenities
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param filters - Optional filters for listing amenities
 * @returns Paginated list of amenities
 * @throws ApiError if request fails
 */
export async function listAmenities(
  filters?: ListAmenitiesFilters
): Promise<PagedResult<AmenitySummaryDto>> {
  console.log('[Amenities API] 📋 LIST AMENITIES REQUEST:', {
    filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const params: Record<string, unknown> = {};
    
    if (filters?.type) params.type = filters.type;
    if (filters?.status) params.status = filters.status;
    if (filters?.isBookable !== undefined) params.isBookable = filters.isBookable;
    if (filters?.isVisibleInApp !== undefined) params.isVisibleInApp = filters.isVisibleInApp;
    if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await apiClient.get<PagedResult<AmenitySummaryDto>>(
      '/v1/tenant/amenities',
      { params }
    );

    console.log('[Amenities API] ✅ LIST AMENITIES RESPONSE:', {
      status: response.status,
      itemCount: response.data.items.length,
      totalCount: response.data.totalCount,
      page: response.data.page,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Amenities API] ❌ LIST AMENITIES ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets an amenity by its ID.
 * 
 * Backend Endpoint: GET /api/v1/tenant/amenities/{id}
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param id - Amenity ID (GUID)
 * @returns Amenity details
 * @throws ApiError if request fails
 */
export async function getAmenityById(id: string): Promise<AmenityDto> {
  console.log('[Amenities API] 🔍 GET AMENITY BY ID REQUEST:', {
    id,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.get<AmenityDto>(
      `/v1/tenant/amenities/${id}`
    );

    console.log('[Amenities API] ✅ GET AMENITY BY ID RESPONSE:', {
      status: response.status,
      id: response.data.id,
      name: response.data.name,
      isBookable: response.data.isBookable,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Amenities API] ❌ GET AMENITY BY ID ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      id,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets availability for an amenity on a specific date.
 * 
 * Backend Endpoint: GET /api/v1/tenant/amenities/{id}/availability?date=YYYY-MM-DD
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param id - Amenity ID (GUID)
 * @param date - Date in YYYY-MM-DD format
 * @returns Availability information with available slots
 * @throws ApiError if request fails
 */
export async function getAmenityAvailability(
  id: string,
  date: string // YYYY-MM-DD format
): Promise<AmenityAvailabilityDto> {
  console.log('[Amenities API] 📅 GET AMENITY AVAILABILITY REQUEST:', {
    id,
    date,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.get<AmenityAvailabilityDto>(
      `/v1/tenant/amenities/${id}/availability`,
      { params: { date } }
    );

    console.log('[Amenities API] ✅ GET AMENITY AVAILABILITY RESPONSE:', {
      status: response.status,
      amenityId: response.data.amenityId,
      date: response.data.date,
      slotCount: response.data.availableSlots.length,
      isBlackoutDate: response.data.isBlackoutDate,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Amenities API] ❌ GET AMENITY AVAILABILITY ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      id,
      date,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets amenity bookings based on user's permission level.
 * - CanViewAll: Returns all bookings
 * - CanViewUnit: Returns bookings for user's units
 * - CanViewOwn: Returns only user's own bookings
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/bookings
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param filters - Optional filters for listing bookings
 * @returns Paginated list of bookings
 * @throws ApiError if request fails
 */
export async function getMyBookings(
  filters?: ListBookingsFilters
): Promise<PagedResult<AmenityBookingSummaryDto>> {
  console.log('[Amenities API] 📖 GET MY BOOKINGS REQUEST:', {
    filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const params: Record<string, unknown> = {};
    
    if (filters?.amenityId) params.amenityId = filters.amenityId;
    if (filters?.status) params.status = filters.status;
    if (filters?.fromDate) params.fromDate = filters.fromDate;
    if (filters?.toDate) params.toDate = filters.toDate;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await apiClient.get<PagedResult<AmenityBookingSummaryDto>>(
      '/v1/tenant/me/bookings',
      { params }
    );

    console.log('[Amenities API] ✅ GET MY BOOKINGS RESPONSE:', {
      status: response.status,
      itemCount: response.data.items.length,
      totalCount: response.data.totalCount,
      page: response.data.page,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Amenities API] ❌ GET MY BOOKINGS ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Create amenity booking request DTO
 */
export interface CreateAmenityBookingRequest {
  amenityId: string;
  unitId: string;
  startAt: string; // ISO 8601 datetime string
  endAt: string; // ISO 8601 datetime string
  source: string; // e.g., "MobileApp"
  title?: string;
  notes?: string;
  numberOfGuests?: number;
  bookedForUserId: string;
}

/**
 * Create amenity booking response DTO
 */
export interface CreateAmenityBookingResponse {
  id: string;
  amenityId: string;
  amenityName: string;
  unitId: string;
  unitNumber: string;
  startAt: string;
  endAt: string;
  status: AmenityBookingStatus;
  source: string;
  title?: string;
  notes?: string;
  numberOfGuests?: number;
  bookedForUserId: string;
  createdAt: string;
}

/**
 * Create a new amenity booking
 * 
 * POST /api/v1/tenant/amenity-bookings
 * 
 * Required headers:
 * - Authorization: Bearer <token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param bookingData - Booking request data
 * @returns Created booking response
 * @throws ApiError if request fails
 */
export async function createAmenityBooking(
  bookingData: CreateAmenityBookingRequest
): Promise<CreateAmenityBookingResponse> {
  console.log('[Amenities API] 📝 CREATE BOOKING FUNCTION CALLED');
  console.log('[Amenities API] 📝 CREATE BOOKING REQUEST:', {
    amenityId: bookingData.amenityId,
    unitId: bookingData.unitId,
    startAt: bookingData.startAt,
    endAt: bookingData.endAt,
    source: bookingData.source,
    bookedForUserId: bookingData.bookedForUserId,
    title: bookingData.title,
    notes: bookingData.notes,
    numberOfGuests: bookingData.numberOfGuests,
    fullPayload: JSON.stringify(bookingData, null, 2),
    timestamp: new Date().toISOString(),
  });

  console.log('[Amenities API] 🌐 PREPARING API CALL...');
  console.log('[Amenities API] 🌐 Endpoint: POST /v1/tenant/amenity-bookings');
  
  // Log the full request payload in a clear format
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[Amenities API] 📤 POST REQUEST PAYLOAD:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(JSON.stringify(bookingData, null, 2));
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[Amenities API] 📤 Request Payload (object):', bookingData);

  try {
    console.log('[Amenities API] ⏳ CALLING apiClient.post()...');
    const response = await apiClient.post<CreateAmenityBookingResponse>(
      '/v1/tenant/amenity-bookings',
      bookingData
    );

    console.log('[Amenities API] ✅ API CALL SUCCESSFUL');
    console.log('[Amenities API] ✅ CREATE BOOKING RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      bookingId: response.data.id,
      status: response.data.status,
      amenityName: response.data.amenityName,
      fullResponse: JSON.stringify(response.data, null, 2),
      timestamp: new Date().toISOString(),
    });

    console.log('[Amenities API] ✅ RETURNING RESPONSE DATA');
    return response.data;
  } catch (error: any) {
    console.error('[Amenities API] ❌ API CALL FAILED');
    console.error('[Amenities API] ❌ CREATE BOOKING ERROR:', {
      errorType: typeof error,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      status: error?.status || error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      responseHeaders: error?.response?.headers,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      timestamp: new Date().toISOString(),
    });
    console.error('[Amenities API] ❌ THROWING ERROR...');
    throw error;
  }
}

/**
 * Cancel booking request DTO
 */
export interface CancelBookingRequest {
  reason: string;
}

/**
 * Cancel an existing amenity booking
 * 
 * POST /api/v1/tenant/me/bookings/{bookingId}/cancel
 * 
 * Required headers:
 * - Authorization: Bearer <token>
 * - X-Tenant-Code: <tenant-code>
 * 
 * @param bookingId - The booking ID to cancel
 * @param reason - Cancellation reason
 * @returns void on success
 * @throws ApiError if request fails
 */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<void> {
  console.log('[Amenities API] 🚫 CANCEL BOOKING REQUEST:', {
    bookingId,
    reason,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.post(
      `/v1/tenant/me/bookings/${bookingId}/cancel`,
      { reason }
    );

    console.log('[Amenities API] ✅ CANCEL BOOKING SUCCESS:', {
      status: response.status,
      bookingId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Amenities API] ❌ CANCEL BOOKING ERROR:', {
      errorType: typeof error,
      errorMessage: error?.message,
      status: error?.status || error?.response?.status,
      responseData: error?.response?.data,
      bookingId,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
