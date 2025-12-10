/**
 * Visitors API Service
 * 
 * Handles visitor pass-related API calls including listing, creating, and managing visitor passes.
 */

import apiClient from './apiClient';

/**
 * Visitor Pass Status enum matching backend
 */
export enum VisitorPassStatus {
  PreRegistered = 'PreRegistered',
  AtGatePendingApproval = 'AtGatePendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  CheckedIn = 'CheckedIn',
  CheckedOut = 'CheckedOut',
  Expired = 'Expired',
}

/**
 * Visitor Type enum matching backend
 */
export enum VisitorType {
  Guest = 'Guest',
  Delivery = 'Delivery',
  Service = 'Service',
  Other = 'Other',
}

/**
 * Visitor Source enum matching backend
 */
export enum VisitorSource {
  MobileApp = 'MobileApp',
  WebPortal = 'WebPortal',
  WalkIn = 'WalkIn',
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
 * Visitor Pass Summary DTO for list views
 * Response from GET /v1/tenant/me/visitors
 */
export interface VisitorPassSummaryDto {
  id: string;
  unitNumber: string;
  blockName: string | null;
  visitType: VisitorType;
  source: VisitorSource;
  accessCode: string;
  visitorName: string;
  visitorPhone: string;
  deliveryProvider: string | null;
  expectedFrom: string; // ISO 8601 datetime
  expectedTo: string; // ISO 8601 datetime
  checkInAt: string | null; // ISO 8601 datetime
  checkOutAt: string | null; // ISO 8601 datetime
  status: VisitorPassStatus;
  createdAt: string; // ISO 8601 datetime
}

/**
 * Filters for listing visitor passes
 */
export interface ListVisitorsFilters {
  status?: VisitorPassStatus;
  visitType?: VisitorType;
  fromDate?: string; // ISO 8601 datetime
  toDate?: string; // ISO 8601 datetime
  page?: number;
  pageSize?: number;
}

/**
 * Request DTO for creating a visitor pass
 * Request body for POST /v1/tenant/visitors/passes
 */
export interface CreateVisitorPassRequest {
  unitId: string;
  visitorName: string;
  visitType: VisitorType;
  visitorPhone: string;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  deliveryProvider?: string | null;
  notes?: string | null;
  expectedFrom: string; // ISO 8601 datetime
  expectedTo: string; // ISO 8601 datetime
  notifyVisitorAtGate: boolean;
}

/**
 * Response DTO for creating a visitor pass
 * Response from POST /v1/tenant/visitors/passes
 */
export interface CreateVisitorPassResponse {
  id: string;
  accessCode: string;
}

/**
 * Gets visitor passes based on user's permission level.
 * - CanViewAll: Returns all visitor passes
 * - CanViewUnit: Returns visitor passes for user's units
 * - CanViewOwn: Returns only visitor passes created by the user
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/visitors
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param filters - Optional filters for listing visitor passes
 * @returns Paginated list of visitor passes
 * @throws ApiError if request fails
 */
export async function getMyVisitors(
  filters?: ListVisitorsFilters
): Promise<PagedResult<VisitorPassSummaryDto>> {
  console.log('[Visitors API] 📋 GET MY VISITORS REQUEST:', {
    filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const params: Record<string, unknown> = {};
    
    if (filters?.status) params.status = filters.status;
    if (filters?.visitType) params.visitType = filters.visitType;
    if (filters?.fromDate) params.fromDate = filters.fromDate;
    if (filters?.toDate) params.toDate = filters.toDate;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await apiClient.get<PagedResult<VisitorPassSummaryDto>>(
      '/v1/tenant/me/visitors',
      { params }
    );

    console.log('[Visitors API] ✅ GET MY VISITORS RESPONSE:', {
      status: response.status,
      itemCount: response.data.items.length,
      totalCount: response.data.totalCount,
      page: response.data.page,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Visitors API] ❌ GET MY VISITORS ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Creates a new pre-registered visitor pass (resident flow).
 * Returns the pass ID and shareable access code.
 * 
 * Backend Endpoint: POST /api/v1/tenant/visitors/passes
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param request - Visitor pass creation request data
 * @returns Created visitor pass response with ID and access code
 * @throws ApiError if request fails
 */
export async function createVisitorPass(
  request: CreateVisitorPassRequest
): Promise<CreateVisitorPassResponse> {
  console.log('[Visitors API] 📝 CREATE VISITOR PASS REQUEST:', {
    unitId: request.unitId,
    visitorName: request.visitorName,
    visitType: request.visitType,
    expectedFrom: request.expectedFrom,
    expectedTo: request.expectedTo,
    notifyVisitorAtGate: request.notifyVisitorAtGate,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.post<CreateVisitorPassResponse>(
      '/v1/tenant/visitors/passes',
      request
    );

    console.log('[Visitors API] ✅ CREATE VISITOR PASS RESPONSE:', {
      status: response.status,
      visitorPassId: response.data.id,
      accessCode: response.data.accessCode,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Visitors API] ❌ CREATE VISITOR PASS ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
