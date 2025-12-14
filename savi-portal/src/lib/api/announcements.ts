/**
 * Announcements API functions
 * Handles tenant-level announcement CRUD and engagement operations
 * Includes: Announcements, Comments, Likes, Read tracking, and Image uploads
 */

import { httpClient } from '@/lib/http';
import { PagedResult } from '@/types/http';
import { API_BASE_URL } from '@/config/env';
import { useScopeStore } from '@/lib/store/scope-store';
import {
  Announcement,
  AnnouncementSummary,
  AnnouncementComment,
  LikeResponse,
  // Request types
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  PublishAnnouncementRequest,
  PinAnnouncementRequest,
  AddAnnouncementCommentRequest,
  // Query params
  ListAnnouncementsParams,
  ListAnnouncementsFeedParams,
  ListCommentsParams,
} from '@/types/announcement';

// ============================================
// API Endpoints
// ============================================

const BASE_URL = '/api/v1/tenant/announcements';
const TEMP_UPLOADS_BASE = '/api/v1/tenant/files/temp';

// ============================================
// File Upload Helpers
// ============================================

/**
 * Response from temp file upload
 */
export interface TempUploadResponse {
  tempKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string;
}

/**
 * Generates a client-side UUID v4 to be used as a temp file key.
 */
export function generateTempKey(): string {
  return crypto.randomUUID();
}

/**
 * Uploads an image to temporary storage for attachment to an announcement.
 * 
 * @param file - The file to upload
 * @param tempKey - The GUID key for this upload (generated via generateTempKey)
 * @param getToken - Function to get the auth token
 * @returns TempUploadResponse with the temp key and file metadata
 */
export async function uploadAnnouncementImage(
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
// Announcements CRUD (Admin)
// ============================================

/**
 * Lists announcements with pagination and filters (admin view)
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function listAnnouncements(
  params: ListAnnouncementsParams = {}
): Promise<PagedResult<AnnouncementSummary>> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.category) searchParams.set('category', params.category);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.isPinned !== undefined) searchParams.set('isPinned', String(params.isPinned));
  if (params.isEvent !== undefined) searchParams.set('isEvent', String(params.isEvent));
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;

  return httpClient.get<PagedResult<AnnouncementSummary>>(url);
}

/**
 * Lists published announcements for residents (feed view)
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function listAnnouncementsFeed(
  params: ListAnnouncementsFeedParams = {}
): Promise<PagedResult<AnnouncementSummary>> {
  const searchParams = new URLSearchParams();

  if (params.category) searchParams.set('category', params.category);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.isEvent !== undefined) searchParams.set('isEvent', String(params.isEvent));
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/feed?${query}` : `${BASE_URL}/feed`;

  return httpClient.get<PagedResult<AnnouncementSummary>>(url);
}

/**
 * Gets an announcement by ID (admin view)
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function getAnnouncementById(id: string): Promise<Announcement> {
  return httpClient.get<Announcement>(`${BASE_URL}/${id}`);
}

/**
 * Gets an announcement by ID (resident view - marks as read)
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function viewAnnouncement(id: string): Promise<Announcement> {
  return httpClient.get<Announcement>(`${BASE_URL}/${id}/view`);
}

/**
 * Creates a new announcement
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function createAnnouncement(
  data: CreateAnnouncementRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(BASE_URL, data);
}

/**
 * Updates an existing announcement
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementRequest
): Promise<void> {
  return httpClient.put<void>(`${BASE_URL}/${id}`, data);
}

/**
 * Deletes an announcement (soft delete)
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  return httpClient.delete<void>(`${BASE_URL}/${id}`);
}

// ============================================
// Lifecycle Operations
// ============================================

/**
 * Publishes or schedules an announcement
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function publishAnnouncement(
  id: string,
  data: PublishAnnouncementRequest
): Promise<void> {
  return httpClient.post<void>(`${BASE_URL}/${id}/publish`, data);
}

/**
 * Archives an announcement
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function archiveAnnouncement(id: string): Promise<void> {
  return httpClient.post<void>(`${BASE_URL}/${id}/archive`, {});
}

/**
 * Pins or unpins an announcement
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function pinAnnouncement(
  id: string,
  data: PinAnnouncementRequest
): Promise<void> {
  return httpClient.post<void>(`${BASE_URL}/${id}/pin`, data);
}

// ============================================
// Engagement - Likes
// ============================================

/**
 * Likes an announcement
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function likeAnnouncement(id: string): Promise<LikeResponse> {
  return httpClient.post<LikeResponse>(`${BASE_URL}/${id}/like`, {});
}

/**
 * Unlikes an announcement
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function unlikeAnnouncement(id: string): Promise<LikeResponse> {
  return httpClient.delete<LikeResponse>(`${BASE_URL}/${id}/like`);
}

// ============================================
// Engagement - Comments
// ============================================

/**
 * Lists comments for an announcement (visible comments only)
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function listComments(
  announcementId: string,
  params: ListCommentsParams = {}
): Promise<PagedResult<AnnouncementComment>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query
    ? `${BASE_URL}/${announcementId}/comments?${query}`
    : `${BASE_URL}/${announcementId}/comments`;

  return httpClient.get<PagedResult<AnnouncementComment>>(url);
}

/**
 * Lists all comments for an announcement including hidden (admin view)
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function listAllComments(
  announcementId: string,
  params: ListCommentsParams = {}
): Promise<PagedResult<AnnouncementComment>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query
    ? `${BASE_URL}/${announcementId}/comments/all?${query}`
    : `${BASE_URL}/${announcementId}/comments/all`;

  return httpClient.get<PagedResult<AnnouncementComment>>(url);
}

/**
 * Adds a comment to an announcement
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function addComment(
  announcementId: string,
  data: AddAnnouncementCommentRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${BASE_URL}/${announcementId}/comments`, data);
}

/**
 * Deletes a comment (user can delete their own)
 * Requires: TENANT_ANNOUNCEMENTS_VIEW permission
 */
export async function deleteComment(
  announcementId: string,
  commentId: string
): Promise<void> {
  return httpClient.delete<void>(`${BASE_URL}/${announcementId}/comments/${commentId}`);
}

/**
 * Hides a comment (moderation action)
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function hideComment(
  announcementId: string,
  commentId: string
): Promise<void> {
  return httpClient.post<void>(
    `${BASE_URL}/${announcementId}/comments/${commentId}/hide`,
    {}
  );
}

/**
 * Unhides a comment (moderation action)
 * Requires: TENANT_ANNOUNCEMENTS_MANAGE permission
 */
export async function unhideComment(
  announcementId: string,
  commentId: string
): Promise<void> {
  return httpClient.post<void>(
    `${BASE_URL}/${announcementId}/comments/${commentId}/unhide`,
    {}
  );
}
