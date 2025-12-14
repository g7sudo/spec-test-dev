/**
 * Maintenance API Service
 * 
 * Handles maintenance request-related API calls including listing, creating,
 * cancelling, commenting, and rating maintenance requests.
 * 
 * Backend Endpoints:
 * - GET /v1/tenant/me/requests - List my maintenance requests
 * - POST /v1/tenant/me/requests - Create maintenance request (multipart)
 * - GET /v1/tenant/maintenance/requests/{id} - Get request details
 * - POST /v1/tenant/me/requests/{id}/cancel - Cancel request
 * - POST /v1/tenant/me/requests/{id}/comments - Add comment
 * - GET /v1/tenant/maintenance/requests/{id}/comments - Get comments
 * - POST /v1/tenant/maintenance/requests/{id}/rate - Rate completed request
 */

import apiClient from './apiClient';

// ============================================================================
// ENUMS - Match backend exactly
// ============================================================================

/**
 * Maintenance Request Status enum matching backend
 */
export enum MaintenanceStatus {
  New = 'New',
  Assigned = 'Assigned',
  InProgress = 'InProgress',
  WaitingForResident = 'WaitingForResident',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

/**
 * Maintenance Priority enum matching backend
 */
export enum MaintenancePriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Critical = 'Critical',
}

/**
 * Maintenance Category Codes (hardcoded in backend)
 */
export enum MaintenanceCategoryCode {
  ELEC = 'ELEC',     // Electrical
  PLUMB = 'PLUMB',   // Plumbing
  HVAC = 'HVAC',     // HVAC
  APPL = 'APPL',     // Appliances
  GEN = 'GEN',       // General
  OTHER = 'OTHER',   // Other
}

/**
 * Maintenance Comment Type enum matching backend
 */
export enum MaintenanceCommentType {
  ResidentComment = 'ResidentComment',
  OwnerComment = 'OwnerComment',
  StaffPublicReply = 'StaffPublicReply',
  StaffInternalNote = 'StaffInternalNote',
  PaymentDiscussion = 'PaymentDiscussion',
  Other = 'Other',
}

/**
 * Maintenance Request Source enum matching backend
 */
export enum MaintenanceSource {
  MobileApp = 'MobileApp',
  WebPortal = 'WebPortal',
  WalkIn = 'WalkIn',
}

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Paginated result structure matching backend PagedResult<T>
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// ============================================================================
// MAINTENANCE REQUEST DTOs
// ============================================================================

/**
 * Maintenance Request Summary DTO for list views
 * Response from GET /v1/tenant/me/requests
 */
export interface MaintenanceRequestSummaryDto {
  id: string;
  ticketNumber: string;
  unitNumber: string;
  categoryName: string;
  title: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  assignedToUserName: string | null;
  requestedAt: string; // ISO 8601 datetime
  dueBy: string | null; // ISO 8601 datetime
}

/**
 * Maintenance Request Detail DTO
 * Response from GET /v1/tenant/maintenance/requests/{id}
 */
export interface MaintenanceRequestDetailDto {
  id: string;
  ticketNumber: string;
  unitId: string;
  unitNumber: string;
  categoryId: string;
  categoryName: string;
  requestedForPartyId: string;
  requestedForPartyName: string;
  requestedByUserId: string;
  requestedByUserName: string;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  title: string;
  description: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  source: MaintenanceSource;
  requestedAt: string; // ISO 8601 datetime
  dueBy: string | null; // ISO 8601 datetime
  assignedAt: string | null; // ISO 8601 datetime
  startedAt: string | null; // ISO 8601 datetime
  completedAt: string | null; // ISO 8601 datetime
  rejectedAt: string | null; // ISO 8601 datetime
  rejectionReason: string | null;
  cancelledAt: string | null; // ISO 8601 datetime
  cancellationReason: string | null;
  residentRating: number | null; // 1-5
  residentFeedback: string | null;
  ratedAt: string | null; // ISO 8601 datetime
  createdAt: string; // ISO 8601 datetime
  // Attachments are fetched separately if needed
}

/**
 * Attachment DTO returned after creating request
 */
export interface MaintenanceAttachmentDto {
  documentId: string;
  fileName: string;
  downloadUrl: string;
}

/**
 * Create Maintenance Request Response
 * Response from POST /v1/tenant/me/requests
 */
export interface CreateMaintenanceRequestResponse {
  requestId: string;
  ticketNumber: string;
  unitNumber: string;
  attachments: MaintenanceAttachmentDto[];
}

/**
 * Maintenance Comment DTO
 * Response from GET /v1/tenant/maintenance/requests/{id}/comments
 */
export interface MaintenanceCommentDto {
  id: string;
  maintenanceRequestId: string;
  commentType: MaintenanceCommentType;
  message: string;
  isVisibleToResident: boolean;
  isVisibleToOwner: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string | null; // ISO 8601 datetime
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for listing maintenance requests
 */
export interface ListMaintenanceFilters {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  fromDate?: string; // ISO 8601 datetime
  toDate?: string; // ISO 8601 datetime
  page?: number;
  pageSize?: number;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Create Maintenance Request - Form Data Structure
 * Used with multipart/form-data for file uploads
 */
export interface CreateMaintenanceRequestData {
  categoryCode: MaintenanceCategoryCode;
  title: string;
  description?: string;
  priority?: MaintenancePriority;
  attachments?: { uri: string; type: string; name: string }[];
}

/**
 * Cancel Request DTO
 */
export interface CancelMaintenanceRequestData {
  reason: string;
}

/**
 * Add Comment DTO
 */
export interface AddMaintenanceCommentData {
  message: string;
}

/**
 * Rate Request DTO
 */
export interface RateMaintenanceRequestData {
  rating: number; // 1-5
  feedback?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Gets user's maintenance requests.
 * Permission: TENANT_MAINTENANCE_REQUEST_VIEW_OWN or higher
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/requests
 * 
 * @param filters - Optional filters for listing requests
 * @returns Paginated list of maintenance requests
 * @throws ApiError if request fails
 */
export async function getMyMaintenanceRequests(
  filters?: ListMaintenanceFilters
): Promise<PagedResult<MaintenanceRequestSummaryDto>> {
  console.log('[Maintenance API] 📋 GET MY REQUESTS:', {
    filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const params: Record<string, unknown> = {};
    
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.fromDate) params.fromDate = filters.fromDate;
    if (filters?.toDate) params.toDate = filters.toDate;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await apiClient.get<PagedResult<MaintenanceRequestSummaryDto>>(
      '/v1/tenant/me/requests',
      { params }
    );

    console.log('[Maintenance API] ✅ GET MY REQUESTS RESPONSE:', {
      status: response.status,
      itemCount: response.data.items.length,
      totalCount: response.data.totalCount,
      page: response.data.page,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Maintenance API] ❌ GET MY REQUESTS ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets maintenance request details by ID.
 * Permission: TENANT_MAINTENANCE_REQUEST_VIEW
 * 
 * Backend Endpoint: GET /api/v1/tenant/maintenance/requests/{id}
 * 
 * @param requestId - The ID of the maintenance request
 * @returns Maintenance request details
 * @throws ApiError if request fails
 */
export async function getMaintenanceRequestDetail(
  requestId: string
): Promise<MaintenanceRequestDetailDto> {
  console.log('[Maintenance API] 📋 GET REQUEST DETAIL:', {
    requestId,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.get<MaintenanceRequestDetailDto>(
      `/v1/tenant/maintenance/requests/${requestId}`
    );

    console.log('[Maintenance API] ✅ GET REQUEST DETAIL RESPONSE:', {
      status: response.status,
      ticketNumber: response.data.ticketNumber,
      requestStatus: response.data.status,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Maintenance API] ❌ GET REQUEST DETAIL ERROR:', {
      requestId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Creates a new maintenance request with optional attachments.
 * Uses multipart/form-data for file uploads.
 * Permission: TENANT_MAINTENANCE_REQUEST_CREATE_OWN or higher
 * 
 * Backend Endpoint: POST /api/v1/tenant/me/requests
 * 
 * @param data - Request data including category, title, description, and attachments
 * @returns Created request response with ID and ticket number
 * @throws ApiError if request fails
 */
export async function createMaintenanceRequest(
  data: CreateMaintenanceRequestData
): Promise<CreateMaintenanceRequestResponse> {
  console.log('[Maintenance API] 📝 CREATE REQUEST:', {
    categoryCode: data.categoryCode,
    title: data.title,
    priority: data.priority,
    attachmentCount: data.attachments?.length || 0,
    timestamp: new Date().toISOString(),
  });

  try {
    // Build FormData for multipart request
    const formData = new FormData();
    formData.append('categoryCode', data.categoryCode);
    formData.append('title', data.title);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.priority) {
      formData.append('priority', data.priority);
    }

    // Add attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((attachment, index) => {
        // React Native's FormData expects this specific structure for file uploads
        formData.append('attachments', {
          uri: attachment.uri,
          type: attachment.type || 'image/jpeg',
          name: attachment.name || `photo_${index}.jpg`,
        } as any);
      });
    }

    const response = await apiClient.post<CreateMaintenanceRequestResponse>(
      '/v1/tenant/me/requests',
      formData,
      {
        headers: {
          // Content-Type will be automatically set to multipart/form-data by apiClient
        },
      }
    );

    console.log('[Maintenance API] ✅ CREATE REQUEST RESPONSE:', {
      status: response.status,
      requestId: response.data.requestId,
      ticketNumber: response.data.ticketNumber,
      attachmentCount: response.data.attachments?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Maintenance API] ❌ CREATE REQUEST ERROR:', {
      errorMessage: error.message,
      status: error.status || error.response?.status,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Cancels a maintenance request.
 * Only New or Assigned status requests can be cancelled.
 * Permission: TENANT_MAINTENANCE_REQUEST_CREATE_OWN or higher
 * 
 * Backend Endpoint: POST /api/v1/tenant/me/requests/{id}/cancel
 * 
 * @param requestId - The ID of the maintenance request
 * @param reason - Cancellation reason
 * @throws ApiError if request fails
 */
export async function cancelMaintenanceRequest(
  requestId: string,
  reason: string
): Promise<void> {
  console.log('[Maintenance API] 🚫 CANCEL REQUEST:', {
    requestId,
    reason,
    timestamp: new Date().toISOString(),
  });

  try {
    await apiClient.post(`/v1/tenant/me/requests/${requestId}/cancel`, {
      reason,
    });

    console.log('[Maintenance API] ✅ CANCEL REQUEST SUCCESS:', {
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Maintenance API] ❌ CANCEL REQUEST ERROR:', {
      requestId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets comments for a maintenance request.
 * Permission: TENANT_MAINTENANCE_REQUEST_VIEW
 * 
 * Backend Endpoint: GET /api/v1/tenant/maintenance/requests/{id}/comments
 * 
 * @param requestId - The ID of the maintenance request
 * @param includeInternal - Include staff internal notes (default: true for admins)
 * @returns Array of comments
 * @throws ApiError if request fails
 */
export async function getMaintenanceRequestComments(
  requestId: string,
  includeInternal: boolean = false
): Promise<MaintenanceCommentDto[]> {
  console.log('[Maintenance API] 💬 GET COMMENTS:', {
    requestId,
    includeInternal,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.get<MaintenanceCommentDto[]>(
      `/v1/tenant/maintenance/requests/${requestId}/comments`,
      { params: { includeInternal } }
    );

    console.log('[Maintenance API] ✅ GET COMMENTS RESPONSE:', {
      status: response.status,
      commentCount: response.data.length,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Maintenance API] ❌ GET COMMENTS ERROR:', {
      requestId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Adds a comment to a maintenance request.
 * Auto-sets CommentType=ResidentComment and visibility=true.
 * Permission: TENANT_MAINTENANCE_REQUEST_CREATE_OWN or higher
 * 
 * Backend Endpoint: POST /api/v1/tenant/me/requests/{id}/comments
 * 
 * @param requestId - The ID of the maintenance request
 * @param message - Comment message
 * @returns Created comment ID
 * @throws ApiError if request fails
 */
export async function addMaintenanceRequestComment(
  requestId: string,
  message: string
): Promise<{ commentId: string }> {
  console.log('[Maintenance API] 💬 ADD COMMENT:', {
    requestId,
    messageLength: message.length,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.post<{ commentId: string }>(
      `/v1/tenant/me/requests/${requestId}/comments`,
      { message }
    );

    console.log('[Maintenance API] ✅ ADD COMMENT RESPONSE:', {
      status: response.status,
      commentId: response.data.commentId,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Maintenance API] ❌ ADD COMMENT ERROR:', {
      requestId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Rates a completed maintenance request.
 * Only Completed status requests can be rated.
 * Permission: TENANT_MAINTENANCE_REQUEST_CREATE
 * 
 * Backend Endpoint: POST /api/v1/tenant/maintenance/requests/{id}/rate
 * 
 * @param requestId - The ID of the maintenance request
 * @param rating - Rating from 1-5
 * @param feedback - Optional feedback text
 * @throws ApiError if request fails
 */
export async function rateMaintenanceRequest(
  requestId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  console.log('[Maintenance API] ⭐ RATE REQUEST:', {
    requestId,
    rating,
    hasFeedback: !!feedback,
    timestamp: new Date().toISOString(),
  });

  try {
    await apiClient.post(`/v1/tenant/maintenance/requests/${requestId}/rate`, {
      rating,
      feedback,
    });

    console.log('[Maintenance API] ✅ RATE REQUEST SUCCESS:', {
      requestId,
      rating,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Maintenance API] ❌ RATE REQUEST ERROR:', {
      requestId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

/**
 * Category configuration with labels and icons
 * Maps backend codes to UI-friendly labels and Ionicons names
 */
export const MAINTENANCE_CATEGORIES = [
  { code: MaintenanceCategoryCode.ELEC, label: 'Electrical', icon: 'flash-outline' as const },
  { code: MaintenanceCategoryCode.PLUMB, label: 'Plumbing', icon: 'water-outline' as const },
  { code: MaintenanceCategoryCode.HVAC, label: 'HVAC', icon: 'snow-outline' as const },
  { code: MaintenanceCategoryCode.APPL, label: 'Appliances', icon: 'tv-outline' as const },
  { code: MaintenanceCategoryCode.GEN, label: 'General', icon: 'hammer-outline' as const },
  { code: MaintenanceCategoryCode.OTHER, label: 'Other', icon: 'ellipsis-horizontal-outline' as const },
] as const;

/**
 * Priority configuration with labels and colors
 */
export const MAINTENANCE_PRIORITIES = [
  { value: MaintenancePriority.Low, label: 'Low', color: '#6C757D' },
  { value: MaintenancePriority.Normal, label: 'Normal', color: '#17A2B8' },
  { value: MaintenancePriority.High, label: 'High', color: '#FFC107' },
  { value: MaintenancePriority.Critical, label: 'Critical', color: '#DC3545' },
] as const;
