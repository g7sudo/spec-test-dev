/**
 * Maintenance API functions
 * Handles tenant-level maintenance CRUD operations
 * Includes Categories, Requests, Details, Approvals, and Comments
 */

import { httpClient } from '@/lib/http';
import { PagedResult } from '@/types/http';
import {
  MaintenanceCategory,
  MaintenanceCategorySummary,
  MaintenanceRequest,
  MaintenanceRequestSummary,
  MaintenanceRequestDetail,
  MaintenanceApproval,
  MaintenanceComment,
  // Request types
  CreateMaintenanceCategoryRequest,
  UpdateMaintenanceCategoryRequest,
  CreateMaintenanceRequestRequest,
  UpdateMaintenanceRequestRequest,
  AssignMaintenanceRequestRequest,
  RejectMaintenanceRequestRequest,
  CancelMaintenanceRequestRequest,
  SubmitAssessmentRequest,
  RateMaintenanceRequestRequest,
  AddMaintenanceDetailRequest,
  UpdateMaintenanceDetailRequest,
  RequestApprovalRequest,
  RejectApprovalRequest,
  RecordPaymentRequest,
  AddCommentRequest,
  // Query params
  ListMaintenanceCategoriesParams,
  ListMaintenanceRequestsParams,
} from '@/types/maintenance';

// ============================================
// API Endpoints
// ============================================

const CATEGORIES_BASE = '/api/v1/tenant/maintenance/categories';
const REQUESTS_BASE = '/api/v1/tenant/maintenance/requests';

// ============================================
// Categories CRUD
// ============================================

/**
 * Lists maintenance categories with pagination
 */
export async function listMaintenanceCategories(
  params: ListMaintenanceCategoriesParams = {}
): Promise<PagedResult<MaintenanceCategorySummary>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${CATEGORIES_BASE}?${query}` : CATEGORIES_BASE;

  return httpClient.get<PagedResult<MaintenanceCategorySummary>>(url);
}

/**
 * Gets a category by ID
 */
export async function getMaintenanceCategoryById(id: string): Promise<MaintenanceCategory> {
  return httpClient.get<MaintenanceCategory>(`${CATEGORIES_BASE}/${id}`);
}

/**
 * Creates a new category
 */
export async function createMaintenanceCategory(
  data: CreateMaintenanceCategoryRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(CATEGORIES_BASE, data);
}

/**
 * Updates an existing category
 */
export async function updateMaintenanceCategory(
  id: string,
  data: UpdateMaintenanceCategoryRequest
): Promise<void> {
  return httpClient.put<void>(`${CATEGORIES_BASE}/${id}`, data);
}

/**
 * Deletes a category (soft delete)
 */
export async function deleteMaintenanceCategory(id: string): Promise<void> {
  return httpClient.delete<void>(`${CATEGORIES_BASE}/${id}`);
}

// ============================================
// Requests CRUD
// ============================================

/**
 * Lists maintenance requests with pagination and filters
 */
export async function listMaintenanceRequests(
  params: ListMaintenanceRequestsParams = {}
): Promise<PagedResult<MaintenanceRequestSummary>> {
  const searchParams = new URLSearchParams();

  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.unitId) searchParams.set('unitId', params.unitId);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.assignedToUserId) searchParams.set('assignedToUserId', params.assignedToUserId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${REQUESTS_BASE}?${query}` : REQUESTS_BASE;

  return httpClient.get<PagedResult<MaintenanceRequestSummary>>(url);
}

/**
 * Lists current user's maintenance requests
 */
export async function listMyMaintenanceRequests(
  params: ListMaintenanceRequestsParams = {}
): Promise<PagedResult<MaintenanceRequestSummary>> {
  const searchParams = new URLSearchParams();

  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${REQUESTS_BASE}/my?${query}` : `${REQUESTS_BASE}/my`;

  return httpClient.get<PagedResult<MaintenanceRequestSummary>>(url);
}

/**
 * Gets a request by ID
 */
export async function getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
  return httpClient.get<MaintenanceRequest>(`${REQUESTS_BASE}/${id}`);
}

/**
 * Creates a new maintenance request
 */
export async function createMaintenanceRequest(
  data: CreateMaintenanceRequestRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(REQUESTS_BASE, data);
}

/**
 * Updates an existing maintenance request
 */
export async function updateMaintenanceRequest(
  id: string,
  data: UpdateMaintenanceRequestRequest
): Promise<void> {
  return httpClient.put<void>(`${REQUESTS_BASE}/${id}`, data);
}

// ============================================
// Workflow Operations
// ============================================

/**
 * Assigns a request to a technician
 */
export async function assignMaintenanceRequest(
  id: string,
  data: AssignMaintenanceRequestRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/assign`, data);
}

/**
 * Unassigns technician from a request
 */
export async function unassignMaintenanceRequest(id: string): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/unassign`, {});
}

/**
 * Starts work on a request (transitions to InProgress)
 */
export async function startMaintenanceRequest(id: string): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/start`, {});
}

/**
 * Completes a maintenance request
 */
export async function completeMaintenanceRequest(id: string): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/complete`, {});
}

/**
 * Rejects a maintenance request
 */
export async function rejectMaintenanceRequest(
  id: string,
  data: RejectMaintenanceRequestRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/reject`, data);
}

/**
 * Cancels a maintenance request
 */
export async function cancelMaintenanceRequest(
  id: string,
  data?: CancelMaintenanceRequestRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/cancel`, data || {});
}

/**
 * Submits assessment summary after site visit
 */
export async function submitAssessment(
  id: string,
  data: SubmitAssessmentRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/assessment`, data);
}

// ============================================
// Request Details (Line Items)
// ============================================

/**
 * Lists detail lines for a maintenance request
 */
export async function listMaintenanceRequestDetails(
  requestId: string
): Promise<MaintenanceRequestDetail[]> {
  return httpClient.get<MaintenanceRequestDetail[]>(`${REQUESTS_BASE}/${requestId}/details`);
}

/**
 * Adds a detail line to a request
 */
export async function addMaintenanceRequestDetail(
  requestId: string,
  data: AddMaintenanceDetailRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${REQUESTS_BASE}/${requestId}/details`, data);
}

/**
 * Updates a detail line
 */
export async function updateMaintenanceRequestDetail(
  requestId: string,
  detailId: string,
  data: UpdateMaintenanceDetailRequest
): Promise<void> {
  return httpClient.put<void>(`${REQUESTS_BASE}/${requestId}/details/${detailId}`, data);
}

/**
 * Deletes a detail line
 */
export async function deleteMaintenanceRequestDetail(
  requestId: string,
  detailId: string
): Promise<void> {
  return httpClient.delete<void>(`${REQUESTS_BASE}/${requestId}/details/${detailId}`);
}

// ============================================
// Approvals
// ============================================

/**
 * Gets approval status for a request
 */
export async function getMaintenanceApproval(requestId: string): Promise<MaintenanceApproval | null> {
  try {
    return await httpClient.get<MaintenanceApproval>(`${REQUESTS_BASE}/${requestId}/approval`);
  } catch {
    // Return null if no approval exists
    return null;
  }
}

/**
 * Requests owner approval for a maintenance request
 */
export async function requestApproval(
  requestId: string,
  data: RequestApprovalRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${REQUESTS_BASE}/${requestId}/approval/request`, data);
}

/**
 * Approves a maintenance request (owner action)
 */
export async function approveMaintenanceRequest(requestId: string): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${requestId}/approval/approve`, {});
}

/**
 * Rejects approval for a maintenance request (owner action)
 */
export async function rejectApproval(
  requestId: string,
  data: RejectApprovalRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${requestId}/approval/reject`, data);
}

/**
 * Records owner payment for approved work
 */
export async function recordPayment(
  requestId: string,
  data: RecordPaymentRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${requestId}/approval/payment`, data);
}

// ============================================
// Comments
// ============================================

/**
 * Lists comments for a maintenance request
 */
export async function listMaintenanceComments(requestId: string): Promise<MaintenanceComment[]> {
  return httpClient.get<MaintenanceComment[]>(`${REQUESTS_BASE}/${requestId}/comments`);
}

/**
 * Adds a comment to a maintenance request
 */
export async function addMaintenanceComment(
  requestId: string,
  data: AddCommentRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${REQUESTS_BASE}/${requestId}/comments`, data);
}

/**
 * Deletes a comment
 */
export async function deleteMaintenanceComment(
  requestId: string,
  commentId: string
): Promise<void> {
  return httpClient.delete<void>(`${REQUESTS_BASE}/${requestId}/comments/${commentId}`);
}

// ============================================
// Rating (Resident feedback)
// ============================================

/**
 * Rates a completed maintenance request
 */
export async function rateMaintenanceRequest(
  id: string,
  data: RateMaintenanceRequestRequest
): Promise<void> {
  return httpClient.post<void>(`${REQUESTS_BASE}/${id}/rate`, data);
}

