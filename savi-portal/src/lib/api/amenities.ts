/**
 * Amenity API functions
 * Handles tenant-level amenity CRUD operations (Amenities, Bookings, Blackouts)
 */

import { httpClient } from '@/lib/http';
import { API_BASE_URL } from '@/config/env';
import { useScopeStore } from '@/lib/store/scope-store';
import { TempUploadResponse } from '@/types/profile';
import {
  Amenity,
  AmenitySummary,
  AmenityAvailability,
  AmenityBooking,
  AmenityBookingSummary,
  AmenityBlackout,
  PagedResult,
  ListAmenitiesParams,
  ListBookingsParams,
  ListBlackoutsParams,
  CreateAmenityRequest,
  UpdateAmenityRequest,
  CreateBookingRequest,
  ApproveBookingRequest,
  RejectBookingRequest,
  CancelBookingRequest,
  UpdateDepositStatusRequest,
  CreateBlackoutRequest,
  UpdateBlackoutRequest,
} from '@/types/amenity';

// ============================================
// API Endpoints
// ============================================

const AMENITIES_BASE = '/api/v1/tenant/amenities';
const BOOKINGS_BASE = '/api/v1/tenant/amenity-bookings';
const BLACKOUTS_BASE = '/api/v1/tenant/amenity-blackouts';
const TEMP_UPLOADS_BASE = '/api/v1/tenant/files/temp';

// ============================================
// File Upload Helpers
// ============================================

/**
 * Generates a client-side UUID v4 to be used as a temp file key.
 */
export function generateTempKey(): string {
  return crypto.randomUUID();
}

/**
 * Uploads a file to temporary storage for later attachment to an amenity.
 * 
 * @param file - The file to upload
 * @param tempKey - The GUID key for this upload (generated via generateTempKey)
 * @param getToken - Function to get the auth token
 * @returns TempUploadResponse with the temp key and file metadata
 */
export async function uploadAmenityImage(
  file: File,
  tempKey: string,
  getToken: () => Promise<string | null>
): Promise<TempUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Get auth token and tenant ID
  const token = await getToken();
  const tenantId = useScopeStore.getState().tenantId;

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  // Pass tempKey as query parameter
  const url = `${API_BASE_URL}${TEMP_UPLOADS_BASE}?tempKey=${encodeURIComponent(tempKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

// ============================================
// Amenities CRUD
// ============================================

/**
 * Lists amenities with pagination and filtering
 */
export async function listAmenities(
  params: ListAmenitiesParams = {}
): Promise<PagedResult<AmenitySummary>> {
  const searchParams = new URLSearchParams();

  if (params.type) searchParams.set('type', params.type);
  if (params.status) searchParams.set('status', params.status);
  if (params.isBookable !== undefined) searchParams.set('isBookable', params.isBookable.toString());
  if (params.isVisibleInApp !== undefined) searchParams.set('isVisibleInApp', params.isVisibleInApp.toString());
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${AMENITIES_BASE}?${query}` : AMENITIES_BASE;

  return httpClient.get<PagedResult<AmenitySummary>>(url);
}

/**
 * Gets an amenity by ID
 */
export async function getAmenityById(id: string): Promise<Amenity> {
  return httpClient.get<Amenity>(`${AMENITIES_BASE}/${id}`);
}

/**
 * Gets availability for an amenity on a specific date
 */
export async function getAmenityAvailability(
  id: string,
  date: string // "YYYY-MM-DD"
): Promise<AmenityAvailability> {
  return httpClient.get<AmenityAvailability>(`${AMENITIES_BASE}/${id}/availability?date=${date}`);
}

/**
 * Creates a new amenity
 */
export async function createAmenity(data: CreateAmenityRequest): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(AMENITIES_BASE, data);
}

/**
 * Updates an existing amenity
 */
export async function updateAmenity(id: string, data: UpdateAmenityRequest): Promise<void> {
  return httpClient.put<void>(`${AMENITIES_BASE}/${id}`, data);
}

// ============================================
// Bookings CRUD
// ============================================

/**
 * Lists bookings with pagination and filtering
 */
export async function listBookings(
  params: ListBookingsParams = {}
): Promise<PagedResult<AmenityBookingSummary>> {
  const searchParams = new URLSearchParams();

  if (params.amenityId) searchParams.set('amenityId', params.amenityId);
  if (params.unitId) searchParams.set('unitId', params.unitId);
  if (params.status) searchParams.set('status', params.status);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${BOOKINGS_BASE}?${query}` : BOOKINGS_BASE;

  return httpClient.get<PagedResult<AmenityBookingSummary>>(url);
}

/**
 * Gets a booking by ID
 */
export async function getBookingById(id: string): Promise<AmenityBooking> {
  return httpClient.get<AmenityBooking>(`${BOOKINGS_BASE}/${id}`);
}

/**
 * Creates a new booking
 */
export async function createBooking(data: CreateBookingRequest): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(BOOKINGS_BASE, data);
}

/**
 * Approves a booking
 */
export async function approveBooking(id: string, data?: ApproveBookingRequest): Promise<void> {
  return httpClient.post<void>(`${BOOKINGS_BASE}/${id}/approve`, data || {});
}

/**
 * Rejects a booking
 */
export async function rejectBooking(id: string, data: RejectBookingRequest): Promise<void> {
  return httpClient.post<void>(`${BOOKINGS_BASE}/${id}/reject`, data);
}

/**
 * Cancels a booking
 */
export async function cancelBooking(id: string, data?: CancelBookingRequest): Promise<void> {
  return httpClient.post<void>(`${BOOKINGS_BASE}/${id}/cancel`, data || {});
}

/**
 * Marks a booking as complete
 */
export async function completeBooking(id: string): Promise<void> {
  return httpClient.post<void>(`${BOOKINGS_BASE}/${id}/complete`, {});
}

/**
 * Updates the deposit status of a booking
 */
export async function updateDepositStatus(
  id: string,
  data: UpdateDepositStatusRequest
): Promise<void> {
  return httpClient.post<void>(`${BOOKINGS_BASE}/${id}/deposit`, data);
}

// ============================================
// Blackouts CRUD
// ============================================

/**
 * Lists blackouts with pagination and filtering
 */
export async function listBlackouts(
  params: ListBlackoutsParams = {}
): Promise<PagedResult<AmenityBlackout>> {
  const searchParams = new URLSearchParams();

  if (params.amenityId) searchParams.set('amenityId', params.amenityId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  if (params.includePast !== undefined) searchParams.set('includePast', params.includePast.toString());
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${BLACKOUTS_BASE}?${query}` : BLACKOUTS_BASE;

  return httpClient.get<PagedResult<AmenityBlackout>>(url);
}

/**
 * Gets a blackout by ID
 */
export async function getBlackoutById(id: string): Promise<AmenityBlackout> {
  return httpClient.get<AmenityBlackout>(`${BLACKOUTS_BASE}/${id}`);
}

/**
 * Creates a new blackout
 */
export async function createBlackout(data: CreateBlackoutRequest): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(BLACKOUTS_BASE, data);
}

/**
 * Updates an existing blackout
 */
export async function updateBlackout(id: string, data: UpdateBlackoutRequest): Promise<void> {
  return httpClient.put<void>(`${BLACKOUTS_BASE}/${id}`, data);
}

/**
 * Deletes a blackout (soft delete)
 */
export async function deleteBlackout(id: string): Promise<void> {
  return httpClient.delete<void>(`${BLACKOUTS_BASE}/${id}`);
}

