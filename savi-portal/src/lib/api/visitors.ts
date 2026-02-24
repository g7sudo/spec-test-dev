/**
 * Visitors API functions
 * Handles tenant-level visitor pass operations
 * Includes Overview stats, pass CRUD, and workflow actions
 */

import { httpClient } from '@/lib/http';
import { PagedResult } from '@/types/http';
import {
  VisitorOverview,
  VisitorPass,
  VisitorPassSummary,
  GetVisitorOverviewParams,
  ListVisitorPassesParams,
  CreateVisitorPassRequest,
  CreateVisitorPassResult,
  CreateWalkInPassRequest,
  UpdateVisitorPassRequest,
  RejectVisitorPassRequest,
} from '@/types/visitor';

// ============================================
// API Endpoints
// ============================================

const VISITORS_BASE = '/api/v1/tenant/visitors/passes';

// ============================================
// Overview / Dashboard
// ============================================

/**
 * Gets visitor overview statistics for dashboard
 * Shows counts by status, type, and source for the specified date (defaults to today)
 */
export async function getVisitorOverview(
  params: GetVisitorOverviewParams = {}
): Promise<VisitorOverview> {
  const searchParams = new URLSearchParams();

  // Add date parameter if provided
  if (params.date) {
    searchParams.set('date', params.date);
  }

  const query = searchParams.toString();
  const url = query ? `${VISITORS_BASE}/overview?${query}` : `${VISITORS_BASE}/overview`;

  return httpClient.get<VisitorOverview>(url);
}

// ============================================
// List & Read
// ============================================

/**
 * Lists visitor passes with pagination and filters
 */
export async function listVisitorPasses(
  params: ListVisitorPassesParams = {}
): Promise<PagedResult<VisitorPassSummary>> {
  const searchParams = new URLSearchParams();

  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.unitId) searchParams.set('unitId', params.unitId);
  if (params.status) searchParams.set('status', params.status);
  if (params.visitType) searchParams.set('visitType', params.visitType);
  if (params.source) searchParams.set('source', params.source);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  if (params.currentlyInside !== undefined) searchParams.set('currentlyInside', params.currentlyInside.toString());
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${VISITORS_BASE}?${query}` : VISITORS_BASE;

  return httpClient.get<PagedResult<VisitorPassSummary>>(url);
}

/**
 * Gets a visitor pass by ID (full details)
 */
export async function getVisitorPassById(id: string): Promise<VisitorPass> {
  return httpClient.get<VisitorPass>(`${VISITORS_BASE}/${id}`);
}

/**
 * Gets a visitor pass by access code (for gate security)
 */
export async function getVisitorPassByAccessCode(accessCode: string): Promise<VisitorPass> {
  return httpClient.get<VisitorPass>(`${VISITORS_BASE}/by-code/${accessCode}`);
}

// ============================================
// Create / Update
// ============================================

/**
 * Creates a new pre-registered visitor pass (resident flow)
 * Returns the pass ID and generated access code
 */
export async function createVisitorPass(
  data: CreateVisitorPassRequest
): Promise<CreateVisitorPassResult> {
  return httpClient.post<CreateVisitorPassResult>(VISITORS_BASE, data);
}

/**
 * Creates a walk-in visitor pass (security guard flow)
 * Pass is created with AtGatePendingApproval status
 */
export async function createWalkInPass(
  data: CreateWalkInPassRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${VISITORS_BASE}/walk-in`, data);
}

/**
 * Updates a visitor pass details (before check-in only)
 */
export async function updateVisitorPass(
  id: string,
  data: UpdateVisitorPassRequest
): Promise<void> {
  return httpClient.put<void>(`${VISITORS_BASE}/${id}`, data);
}

// ============================================
// Workflow Operations
// ============================================

/**
 * Approves a visitor pass
 * Valid for: PreRegistered, AtGatePendingApproval
 */
export async function approveVisitorPass(id: string): Promise<void> {
  return httpClient.post<void>(`${VISITORS_BASE}/${id}/approve`, {});
}

/**
 * Rejects a visitor pass with optional reason
 * Valid for: PreRegistered, AtGatePendingApproval
 */
export async function rejectVisitorPass(
  id: string,
  data: RejectVisitorPassRequest = {}
): Promise<void> {
  return httpClient.post<void>(`${VISITORS_BASE}/${id}/reject`, data);
}

/**
 * Checks in a visitor (gate operation)
 * Valid for: PreRegistered, Approved
 */
export async function checkInVisitor(id: string): Promise<void> {
  return httpClient.post<void>(`${VISITORS_BASE}/${id}/check-in`, {});
}

/**
 * Checks out a visitor (gate operation)
 * Valid for: CheckedIn
 */
export async function checkOutVisitor(id: string): Promise<void> {
  return httpClient.post<void>(`${VISITORS_BASE}/${id}/check-out`, {});
}

/**
 * Cancels a visitor pass (before arrival)
 * Cannot cancel if: CheckedIn, CheckedOut, Cancelled
 */
export async function cancelVisitorPass(id: string): Promise<void> {
  return httpClient.post<void>(`${VISITORS_BASE}/${id}/cancel`, {});
}
