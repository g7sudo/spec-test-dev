/**
 * Maintenance Module Types
 * 
 * Re-exports API types and adds any feature-specific types for the maintenance module.
 * Following the pattern: feature-specific types extend or complement API types.
 */

// Re-export all types from the API service for convenience
export {
  // Enums
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategoryCode,
  MaintenanceCommentType,
  MaintenanceSource,
  // DTOs
  type MaintenanceRequestSummaryDto,
  type MaintenanceRequestDetailDto,
  type MaintenanceAttachmentDto,
  type CreateMaintenanceRequestResponse,
  type MaintenanceCommentDto,
  // Filter types
  type ListMaintenanceFilters,
  // Request types
  type CreateMaintenanceRequestData,
  type CancelMaintenanceRequestData,
  type AddMaintenanceCommentData,
  type RateMaintenanceRequestData,
  // Helper constants
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
} from '@/services/api/maintenance';

// ============================================================================
// FEATURE-SPECIFIC TYPES
// ============================================================================

/**
 * Form state for creating a maintenance request
 * Used in CreateMaintenanceScreen for local form state management
 */
export interface MaintenanceFormState {
  categoryCode: string | null;
  title: string;
  description: string;
  priority: string;
  attachments: MaintenanceAttachment[];
}

/**
 * Local representation of an attachment before upload
 * Contains URI for preview and metadata for upload
 */
export interface MaintenanceAttachment {
  id: string; // Local ID for tracking
  uri: string;
  type: string; // MIME type (e.g., 'image/jpeg')
  name: string; // Filename
}

/**
 * Timeline event for displaying request history
 * Constructed from MaintenanceRequestDetailDto timestamps
 */
export interface MaintenanceTimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'started' | 'completed' | 'cancelled' | 'rejected' | 'rated';
  title: string;
  description?: string;
  timestamp: string; // ISO 8601 datetime
  icon: string; // Ionicons name
  color: string; // Status color
}

/**
 * Status variant for StatusPill component
 */
export type MaintenanceStatusVariant = 
  | 'default' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

/**
 * Maps MaintenanceStatus to StatusPill variant
 */
export const getMaintenanceStatusVariant = (
  status: string
): MaintenanceStatusVariant => {
  const statusMap: Record<string, MaintenanceStatusVariant> = {
    New: 'warning',
    Assigned: 'warning',
    InProgress: 'info',
    WaitingForResident: 'warning',
    Completed: 'success',
    Rejected: 'error',
    Cancelled: 'default',
  };
  return statusMap[status] || 'default';
};

/**
 * Maps MaintenanceStatus to user-friendly display label
 */
export const getMaintenanceStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    New: 'New',
    Assigned: 'Assigned',
    InProgress: 'In Progress',
    WaitingForResident: 'Waiting for You',
    Completed: 'Completed',
    Rejected: 'Rejected',
    Cancelled: 'Cancelled',
  };
  return labelMap[status] || status;
};

/**
 * Checks if a request can be cancelled based on its status
 * Only New or Assigned requests can be cancelled
 */
export const canCancelRequest = (status: string): boolean => {
  return status === 'New' || status === 'Assigned';
};

/**
 * Checks if a request can be rated based on its status
 * Only Completed requests can be rated
 */
export const canRateRequest = (status: string): boolean => {
  return status === 'Completed';
};

