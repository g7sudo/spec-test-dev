/**
 * Maintenance Module Types
 * Types for Maintenance Requests, Categories, Details, Approvals, and Comments
 * Maps to backend DTOs from Savi.Application.Tenant.Maintenance
 */

// Re-export PagedResult from http.ts to avoid duplication
export { PagedResult } from './http';

// ============================================
// Enums (values match C# enum strings)
// ============================================

/**
 * Status of a maintenance request ticket
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
 * Priority level of a maintenance request
 */
export enum MaintenancePriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Critical = 'Critical',
}

/**
 * Source/channel from which request was submitted
 */
export enum MaintenanceSource {
  MobileApp = 'MobileApp',
  AdminPortal = 'AdminPortal',
  SecurityDesk = 'SecurityDesk',
  Other = 'Other',
}

/**
 * Type of maintenance request detail line item
 */
export enum MaintenanceDetailType {
  Service = 'Service',
  SparePart = 'SparePart',
  Other = 'Other',
}

/**
 * Status of owner approval for maintenance cost
 */
export enum MaintenanceApprovalStatus {
  NotRequired = 'NotRequired',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

/**
 * Status of owner payment for approved maintenance work
 */
export enum MaintenanceOwnerPaymentStatus {
  NotRequired = 'NotRequired',
  Pending = 'Pending',
  Paid = 'Paid',
  Waived = 'Waived',
}

/**
 * Type of comment on a maintenance request
 */
export enum MaintenanceCommentType {
  ResidentComment = 'ResidentComment',
  OwnerComment = 'OwnerComment',
  StaffPublicReply = 'StaffPublicReply',
  StaffInternalNote = 'StaffInternalNote',
  PaymentDiscussion = 'PaymentDiscussion',
  Other = 'Other',
}

// ============================================
// Category DTOs
// ============================================

/**
 * Maintenance category for requests
 */
export interface MaintenanceCategory {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  displayOrder: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

/**
 * Category summary for list views and dropdowns
 */
export interface MaintenanceCategorySummary {
  id: string;
  name: string;
  code: string | null;
  displayOrder: number;
  isDefault: boolean;
}

/**
 * Create category request
 */
export interface CreateMaintenanceCategoryRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder?: number;
  isDefault?: boolean;
}

/**
 * Update category request
 */
export interface UpdateMaintenanceCategoryRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder?: number;
  isDefault?: boolean;
}

// ============================================
// Request DTOs
// ============================================

/**
 * Full maintenance request details
 */
export interface MaintenanceRequest {
  id: string;
  ticketNumber: string;
  unitId: string;
  unitNumber: string | null;
  categoryId: string;
  categoryName: string | null;
  requestedForPartyId: string;
  requestedForPartyName: string | null;
  requestedByUserId: string;
  requestedByUserName: string | null;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  title: string;
  description: string | null;
  status: MaintenanceStatus | string;
  priority: MaintenancePriority | string;
  source: MaintenanceSource | string;
  requestedAt: string;
  dueBy: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancelledByUserId: string | null;
  cancellationReason: string | null;
  assessmentSummary: string | null;
  assessmentCompletedAt: string | null;
  assessmentByUserId: string | null;
  residentRating: number | null;
  residentFeedback: string | null;
  ratedAt: string | null;
  createdAt: string;
}

/**
 * Maintenance request summary for list views
 */
export interface MaintenanceRequestSummary {
  id: string;
  ticketNumber: string;
  unitNumber: string | null;
  categoryName: string | null;
  title: string;
  status: MaintenanceStatus | string;
  priority: MaintenancePriority | string;
  assignedToUserName: string | null;
  requestedAt: string;
  dueBy: string | null;
}

/**
 * Create maintenance request
 */
export interface CreateMaintenanceRequestRequest {
  unitId: string;
  categoryId: string;
  requestedForPartyId: string;
  title: string;
  description?: string | null;
  priority?: MaintenancePriority;
  source?: MaintenanceSource;
  dueBy?: string | null;
}

/**
 * Update maintenance request
 */
export interface UpdateMaintenanceRequestRequest {
  title: string;
  description?: string | null;
  categoryId: string;
  priority: MaintenancePriority;
}

/**
 * Assign request to technician
 */
export interface AssignMaintenanceRequestRequest {
  assignedToUserId: string;
}

/**
 * Reject request
 */
export interface RejectMaintenanceRequestRequest {
  reason: string;
}

/**
 * Cancel request
 */
export interface CancelMaintenanceRequestRequest {
  reason?: string | null;
}

/**
 * Submit assessment
 */
export interface SubmitAssessmentRequest {
  assessmentSummary: string;
}

/**
 * Rate completed request
 */
export interface RateMaintenanceRequestRequest {
  rating: number;
  feedback?: string | null;
}

// ============================================
// Request Detail (Line Items) DTOs
// ============================================

/**
 * Maintenance request detail line item
 */
export interface MaintenanceRequestDetail {
  id: string;
  maintenanceRequestId: string;
  lineType: MaintenanceDetailType | string;
  description: string;
  quantity: number;
  unitOfMeasure: string | null;
  estimatedUnitPrice: number | null;
  estimatedTotalPrice: number | null;
  isBillable: boolean;
  sortOrder: number;
  createdAt: string;
}

/**
 * Add detail line item
 */
export interface AddMaintenanceDetailRequest {
  lineType: MaintenanceDetailType;
  description: string;
  quantity: number;
  unitOfMeasure?: string | null;
  estimatedUnitPrice?: number | null;
  isBillable?: boolean;
  sortOrder?: number;
}

/**
 * Update detail line item
 */
export interface UpdateMaintenanceDetailRequest {
  lineType: MaintenanceDetailType;
  description: string;
  quantity: number;
  unitOfMeasure?: string | null;
  estimatedUnitPrice?: number | null;
  isBillable?: boolean;
  sortOrder?: number;
}

// ============================================
// Approval DTOs
// ============================================

/**
 * Maintenance approval record
 */
export interface MaintenanceApproval {
  id: string;
  maintenanceRequestId: string;
  ticketNumber: string | null;
  status: MaintenanceApprovalStatus | string;
  requestedAmount: number | null;
  currency: string | null;
  requestedByUserId: string;
  requestedByUserName: string | null;
  requestedAt: string;
  approvedByUserId: string | null;
  approvedByUserName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancelledByUserId: string | null;
  cancellationReason: string | null;
  ownerPaymentStatus: MaintenanceOwnerPaymentStatus | string;
  ownerPaidAmount: number | null;
  ownerPaidAt: string | null;
  ownerPaymentReference: string | null;
  createdAt: string;
}

/**
 * Request owner approval
 */
export interface RequestApprovalRequest {
  requestedAmount?: number | null;
  currency?: string | null;
  requiresOwnerPayment: boolean;
}

/**
 * Reject approval
 */
export interface RejectApprovalRequest {
  reason: string;
}

/**
 * Record payment
 */
export interface RecordPaymentRequest {
  paidAmount: number;
  paymentReference?: string | null;
}

// ============================================
// Comment DTOs
// ============================================

/**
 * Maintenance comment
 */
export interface MaintenanceComment {
  id: string;
  maintenanceRequestId: string;
  commentType: MaintenanceCommentType | string;
  message: string;
  isVisibleToResident: boolean;
  isVisibleToOwner: boolean;
  createdById: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Add comment
 */
export interface AddCommentRequest {
  commentType: MaintenanceCommentType;
  message: string;
  isVisibleToResident?: boolean;
  isVisibleToOwner?: boolean;
}

// ============================================
// List Query Params
// ============================================

export interface ListMaintenanceCategoriesParams {
  page?: number;
  pageSize?: number;
}

export interface ListMaintenanceRequestsParams {
  searchTerm?: string;
  unitId?: string;
  categoryId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  assignedToUserId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for maintenance status
 */
export function getMaintenanceStatusLabel(status: MaintenanceStatus | string): string {
  switch (status) {
    case MaintenanceStatus.New:
    case 'New':
      return 'New';
    case MaintenanceStatus.Assigned:
    case 'Assigned':
      return 'Assigned';
    case MaintenanceStatus.InProgress:
    case 'InProgress':
      return 'In Progress';
    case MaintenanceStatus.WaitingForResident:
    case 'WaitingForResident':
      return 'Waiting for Resident';
    case MaintenanceStatus.Completed:
    case 'Completed':
      return 'Completed';
    case MaintenanceStatus.Rejected:
    case 'Rejected':
      return 'Rejected';
    case MaintenanceStatus.Cancelled:
    case 'Cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes for maintenance status
 */
export function getMaintenanceStatusColor(status: MaintenanceStatus | string): string {
  switch (status) {
    case MaintenanceStatus.New:
    case 'New':
      return 'bg-blue-100 text-blue-700';
    case MaintenanceStatus.Assigned:
    case 'Assigned':
      return 'bg-indigo-100 text-indigo-700';
    case MaintenanceStatus.InProgress:
    case 'InProgress':
      return 'bg-amber-100 text-amber-700';
    case MaintenanceStatus.WaitingForResident:
    case 'WaitingForResident':
      return 'bg-purple-100 text-purple-700';
    case MaintenanceStatus.Completed:
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case MaintenanceStatus.Rejected:
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    case MaintenanceStatus.Cancelled:
    case 'Cancelled':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for maintenance priority
 */
export function getMaintenancePriorityLabel(priority: MaintenancePriority | string): string {
  switch (priority) {
    case MaintenancePriority.Low:
    case 'Low':
      return 'Low';
    case MaintenancePriority.Normal:
    case 'Normal':
      return 'Normal';
    case MaintenancePriority.High:
    case 'High':
      return 'High';
    case MaintenancePriority.Critical:
    case 'Critical':
      return 'Critical';
    default:
      return priority || 'Unknown';
  }
}

/**
 * Gets priority color classes
 */
export function getMaintenancePriorityColor(priority: MaintenancePriority | string): string {
  switch (priority) {
    case MaintenancePriority.Low:
    case 'Low':
      return 'bg-slate-100 text-slate-600';
    case MaintenancePriority.Normal:
    case 'Normal':
      return 'bg-blue-100 text-blue-700';
    case MaintenancePriority.High:
    case 'High':
      return 'bg-orange-100 text-orange-700';
    case MaintenancePriority.Critical:
    case 'Critical':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for maintenance source
 */
export function getMaintenanceSourceLabel(source: MaintenanceSource | string): string {
  switch (source) {
    case MaintenanceSource.MobileApp:
    case 'MobileApp':
      return 'Mobile App';
    case MaintenanceSource.AdminPortal:
    case 'AdminPortal':
      return 'Admin Portal';
    case MaintenanceSource.SecurityDesk:
    case 'SecurityDesk':
      return 'Security Desk';
    case MaintenanceSource.Other:
    case 'Other':
      return 'Other';
    default:
      return source || 'Unknown';
  }
}

/**
 * Gets display label for detail line type
 */
export function getDetailTypeLabel(type: MaintenanceDetailType | string): string {
  switch (type) {
    case MaintenanceDetailType.Service:
    case 'Service':
      return 'Service';
    case MaintenanceDetailType.SparePart:
    case 'SparePart':
      return 'Spare Part';
    case MaintenanceDetailType.Other:
    case 'Other':
      return 'Other';
    default:
      return type || 'Unknown';
  }
}

/**
 * Gets display label for approval status
 */
export function getApprovalStatusLabel(status: MaintenanceApprovalStatus | string): string {
  switch (status) {
    case MaintenanceApprovalStatus.NotRequired:
    case 'NotRequired':
      return 'Not Required';
    case MaintenanceApprovalStatus.Pending:
    case 'Pending':
      return 'Pending';
    case MaintenanceApprovalStatus.Approved:
    case 'Approved':
      return 'Approved';
    case MaintenanceApprovalStatus.Rejected:
    case 'Rejected':
      return 'Rejected';
    case MaintenanceApprovalStatus.Cancelled:
    case 'Cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets approval status color classes
 */
export function getApprovalStatusColor(status: MaintenanceApprovalStatus | string): string {
  switch (status) {
    case MaintenanceApprovalStatus.NotRequired:
    case 'NotRequired':
      return 'bg-gray-100 text-gray-600';
    case MaintenanceApprovalStatus.Pending:
    case 'Pending':
      return 'bg-amber-100 text-amber-700';
    case MaintenanceApprovalStatus.Approved:
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case MaintenanceApprovalStatus.Rejected:
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    case MaintenanceApprovalStatus.Cancelled:
    case 'Cancelled':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for payment status
 */
export function getPaymentStatusLabel(status: MaintenanceOwnerPaymentStatus | string): string {
  switch (status) {
    case MaintenanceOwnerPaymentStatus.NotRequired:
    case 'NotRequired':
      return 'Not Required';
    case MaintenanceOwnerPaymentStatus.Pending:
    case 'Pending':
      return 'Pending';
    case MaintenanceOwnerPaymentStatus.Paid:
    case 'Paid':
      return 'Paid';
    case MaintenanceOwnerPaymentStatus.Waived:
    case 'Waived':
      return 'Waived';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets payment status color classes
 */
export function getPaymentStatusColor(status: MaintenanceOwnerPaymentStatus | string): string {
  switch (status) {
    case MaintenanceOwnerPaymentStatus.NotRequired:
    case 'NotRequired':
      return 'bg-gray-100 text-gray-600';
    case MaintenanceOwnerPaymentStatus.Pending:
    case 'Pending':
      return 'bg-amber-100 text-amber-700';
    case MaintenanceOwnerPaymentStatus.Paid:
    case 'Paid':
      return 'bg-green-100 text-green-700';
    case MaintenanceOwnerPaymentStatus.Waived:
    case 'Waived':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for comment type
 */
export function getCommentTypeLabel(type: MaintenanceCommentType | string): string {
  switch (type) {
    case MaintenanceCommentType.ResidentComment:
    case 'ResidentComment':
      return 'Resident';
    case MaintenanceCommentType.OwnerComment:
    case 'OwnerComment':
      return 'Owner';
    case MaintenanceCommentType.StaffPublicReply:
    case 'StaffPublicReply':
      return 'Staff Reply';
    case MaintenanceCommentType.StaffInternalNote:
    case 'StaffInternalNote':
      return 'Internal Note';
    case MaintenanceCommentType.PaymentDiscussion:
    case 'PaymentDiscussion':
      return 'Payment';
    case MaintenanceCommentType.Other:
    case 'Other':
      return 'Other';
    default:
      return type || 'Unknown';
  }
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
 * Formats currency amount
 */
export function formatCurrency(amount: number | null, currency: string | null = 'USD'): string {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

// ============================================
// Dropdown Options
// ============================================

/**
 * Status options for filters
 */
export const MAINTENANCE_STATUS_OPTIONS = [
  { value: MaintenanceStatus.New, label: 'New' },
  { value: MaintenanceStatus.Assigned, label: 'Assigned' },
  { value: MaintenanceStatus.InProgress, label: 'In Progress' },
  { value: MaintenanceStatus.WaitingForResident, label: 'Waiting for Resident' },
  { value: MaintenanceStatus.Completed, label: 'Completed' },
  { value: MaintenanceStatus.Rejected, label: 'Rejected' },
  { value: MaintenanceStatus.Cancelled, label: 'Cancelled' },
];

/**
 * Priority options for forms and filters
 */
export const MAINTENANCE_PRIORITY_OPTIONS = [
  { value: MaintenancePriority.Low, label: 'Low' },
  { value: MaintenancePriority.Normal, label: 'Normal' },
  { value: MaintenancePriority.High, label: 'High' },
  { value: MaintenancePriority.Critical, label: 'Critical' },
];

/**
 * Source options for forms
 */
export const MAINTENANCE_SOURCE_OPTIONS = [
  { value: MaintenanceSource.MobileApp, label: 'Mobile App' },
  { value: MaintenanceSource.AdminPortal, label: 'Admin Portal' },
  { value: MaintenanceSource.SecurityDesk, label: 'Security Desk' },
  { value: MaintenanceSource.Other, label: 'Other' },
];

/**
 * Detail line type options
 */
export const DETAIL_TYPE_OPTIONS = [
  { value: MaintenanceDetailType.Service, label: 'Service' },
  { value: MaintenanceDetailType.SparePart, label: 'Spare Part' },
  { value: MaintenanceDetailType.Other, label: 'Other' },
];

/**
 * Comment type options for staff
 */
export const COMMENT_TYPE_OPTIONS = [
  { value: MaintenanceCommentType.StaffPublicReply, label: 'Staff Reply (Visible)' },
  { value: MaintenanceCommentType.StaffInternalNote, label: 'Internal Note' },
  { value: MaintenanceCommentType.PaymentDiscussion, label: 'Payment Discussion' },
];

