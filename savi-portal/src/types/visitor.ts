/**
 * Visitor Module Types
 * Types for Visitor Passes, Overview, and related DTOs
 * Maps to backend DTOs from Savi.Application.Tenant.Visitors
 */

// ============================================
// Enums (values match C# enum strings)
// ============================================

/**
 * Type of visitor
 */
export enum VisitorType {
  Guest = 'Guest',
  Delivery = 'Delivery',
  Service = 'Service',
  Other = 'Other',
}

/**
 * Status of a visitor pass
 */
export enum VisitorPassStatus {
  PreRegistered = 'PreRegistered',         // Created by resident in advance
  AtGatePendingApproval = 'AtGatePendingApproval', // Created at gate, waiting for resident approval
  Approved = 'Approved',                   // Approved by resident/admin, allowed to enter
  Rejected = 'Rejected',                   // Explicitly rejected
  CheckedIn = 'CheckedIn',                 // Visitor has entered
  CheckedOut = 'CheckedOut',               // Visitor has left
  Expired = 'Expired',                     // Auto-expired (no show / out of time window)
  Cancelled = 'Cancelled',                 // Cancelled before arrival
}

/**
 * Source/channel from which visitor pass was created
 */
export enum VisitorSource {
  MobileApp = 'MobileApp',     // Created by resident/owner via mobile
  SecurityApp = 'SecurityApp', // Created by guard at gate
  AdminPortal = 'AdminPortal',
  Other = 'Other',
}

// ============================================
// Overview DTOs
// ============================================

/**
 * Count by type breakdown
 */
export interface VisitorTypeBreakdown {
  type: VisitorType | string;
  count: number;
}

/**
 * Count by source breakdown
 */
export interface VisitorSourceBreakdown {
  source: VisitorSource | string;
  count: number;
}

/**
 * Visitor overview statistics for dashboard
 * Response from GET /api/v1/tenant/visitors/passes/overview
 * 
 * Note: byType and bySource can be either:
 *   - Array format: [{ type: 'Guest', count: 5 }]
 *   - Object format: { Guest: 5, Delivery: 3 }
 */
export interface VisitorOverview {
  // Total passes created today
  totalToday: number;
  // Visitors currently inside (checked in, not checked out)
  currentlyInside: number;
  // Walk-in visitors awaiting resident approval
  pendingApproval: number;
  // Pre-registered passes not yet used
  preRegisteredPending: number;
  // Check-in count for today
  checkedInToday: number;
  // Check-out count for today
  checkedOutToday: number;
  // Rejections today
  rejectedToday: number;
  // Expirations today
  expiredToday: number;
  // Breakdown by visitor type - can be array or object from backend
  byType: VisitorTypeBreakdown[] | Record<string, number>;
  // Breakdown by source - can be array or object from backend
  bySource: VisitorSourceBreakdown[] | Record<string, number>;
}

// ============================================
// Query Params
// ============================================

/**
 * Query parameters for visitor overview
 */
export interface GetVisitorOverviewParams {
  // Date to get statistics for (defaults to today on backend)
  date?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for visitor type
 */
export function getVisitorTypeLabel(type: VisitorType | string): string {
  switch (type) {
    case VisitorType.Guest:
    case 'Guest':
      return 'Guest';
    case VisitorType.Delivery:
    case 'Delivery':
      return 'Delivery';
    case VisitorType.Service:
    case 'Service':
      return 'Service';
    case VisitorType.Other:
    case 'Other':
      return 'Other';
    default:
      return type || 'Unknown';
  }
}

/**
 * Gets color classes for visitor type badges
 */
export function getVisitorTypeColor(type: VisitorType | string): string {
  switch (type) {
    case VisitorType.Guest:
    case 'Guest':
      return 'bg-blue-100 text-blue-700';
    case VisitorType.Delivery:
    case 'Delivery':
      return 'bg-amber-100 text-amber-700';
    case VisitorType.Service:
    case 'Service':
      return 'bg-purple-100 text-purple-700';
    case VisitorType.Other:
    case 'Other':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets icon color for visitor type (for charts/icons)
 */
export function getVisitorTypeIconColor(type: VisitorType | string): string {
  switch (type) {
    case VisitorType.Guest:
    case 'Guest':
      return '#3B82F6'; // blue-500
    case VisitorType.Delivery:
    case 'Delivery':
      return '#F59E0B'; // amber-500
    case VisitorType.Service:
    case 'Service':
      return '#8B5CF6'; // purple-500
    case VisitorType.Other:
    case 'Other':
      return '#6B7280'; // gray-500
    default:
      return '#6B7280';
  }
}

/**
 * Gets display label for visitor pass status
 */
export function getVisitorPassStatusLabel(status: VisitorPassStatus | string): string {
  switch (status) {
    case VisitorPassStatus.PreRegistered:
    case 'PreRegistered':
      return 'Pre-Registered';
    case VisitorPassStatus.AtGatePendingApproval:
    case 'AtGatePendingApproval':
      return 'Pending Approval';
    case VisitorPassStatus.Approved:
    case 'Approved':
      return 'Approved';
    case VisitorPassStatus.Rejected:
    case 'Rejected':
      return 'Rejected';
    case VisitorPassStatus.CheckedIn:
    case 'CheckedIn':
      return 'Checked In';
    case VisitorPassStatus.CheckedOut:
    case 'CheckedOut':
      return 'Checked Out';
    case VisitorPassStatus.Expired:
    case 'Expired':
      return 'Expired';
    case VisitorPassStatus.Cancelled:
    case 'Cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets color classes for visitor pass status badges
 */
export function getVisitorPassStatusColor(status: VisitorPassStatus | string): string {
  switch (status) {
    case VisitorPassStatus.PreRegistered:
    case 'PreRegistered':
      return 'bg-slate-100 text-slate-700';
    case VisitorPassStatus.AtGatePendingApproval:
    case 'AtGatePendingApproval':
      return 'bg-amber-100 text-amber-700';
    case VisitorPassStatus.Approved:
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case VisitorPassStatus.Rejected:
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    case VisitorPassStatus.CheckedIn:
    case 'CheckedIn':
      return 'bg-blue-100 text-blue-700';
    case VisitorPassStatus.CheckedOut:
    case 'CheckedOut':
      return 'bg-gray-100 text-gray-600';
    case VisitorPassStatus.Expired:
    case 'Expired':
      return 'bg-orange-100 text-orange-700';
    case VisitorPassStatus.Cancelled:
    case 'Cancelled':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for visitor source
 */
export function getVisitorSourceLabel(source: VisitorSource | string): string {
  switch (source) {
    case VisitorSource.MobileApp:
    case 'MobileApp':
      return 'Mobile App';
    case VisitorSource.SecurityApp:
    case 'SecurityApp':
      return 'Security App';
    case VisitorSource.AdminPortal:
    case 'AdminPortal':
      return 'Admin Portal';
    case VisitorSource.Other:
    case 'Other':
      return 'Other';
    default:
      return source || 'Unknown';
  }
}

/**
 * Gets color classes for visitor source badges
 */
export function getVisitorSourceColor(source: VisitorSource | string): string {
  switch (source) {
    case VisitorSource.MobileApp:
    case 'MobileApp':
      return 'bg-indigo-100 text-indigo-700';
    case VisitorSource.SecurityApp:
    case 'SecurityApp':
      return 'bg-teal-100 text-teal-700';
    case VisitorSource.AdminPortal:
    case 'AdminPortal':
      return 'bg-cyan-100 text-cyan-700';
    case VisitorSource.Other:
    case 'Other':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets icon color for visitor source (for charts/icons)
 */
export function getVisitorSourceIconColor(source: VisitorSource | string): string {
  switch (source) {
    case VisitorSource.MobileApp:
    case 'MobileApp':
      return '#6366F1'; // indigo-500
    case VisitorSource.SecurityApp:
    case 'SecurityApp':
      return '#14B8A6'; // teal-500
    case VisitorSource.AdminPortal:
    case 'AdminPortal':
      return '#06B6D4'; // cyan-500
    case VisitorSource.Other:
    case 'Other':
      return '#6B7280'; // gray-500
    default:
      return '#6B7280';
  }
}

// ============================================
// Dropdown Options
// ============================================

/**
 * Visitor type options for filters and forms
 */
export const VISITOR_TYPE_OPTIONS = [
  { value: VisitorType.Guest, label: 'Guest' },
  { value: VisitorType.Delivery, label: 'Delivery' },
  { value: VisitorType.Service, label: 'Service' },
  { value: VisitorType.Other, label: 'Other' },
];

/**
 * Visitor pass status options for filters
 */
export const VISITOR_PASS_STATUS_OPTIONS = [
  { value: VisitorPassStatus.PreRegistered, label: 'Pre-Registered' },
  { value: VisitorPassStatus.AtGatePendingApproval, label: 'Pending Approval' },
  { value: VisitorPassStatus.Approved, label: 'Approved' },
  { value: VisitorPassStatus.Rejected, label: 'Rejected' },
  { value: VisitorPassStatus.CheckedIn, label: 'Checked In' },
  { value: VisitorPassStatus.CheckedOut, label: 'Checked Out' },
  { value: VisitorPassStatus.Expired, label: 'Expired' },
  { value: VisitorPassStatus.Cancelled, label: 'Cancelled' },
];

/**
 * Visitor source options for filters
 */
export const VISITOR_SOURCE_OPTIONS = [
  { value: VisitorSource.MobileApp, label: 'Mobile App' },
  { value: VisitorSource.SecurityApp, label: 'Security App' },
  { value: VisitorSource.AdminPortal, label: 'Admin Portal' },
  { value: VisitorSource.Other, label: 'Other' },
];

// ============================================
// Pass DTOs (match backend C# DTOs exactly)
// ============================================

/**
 * Full visitor pass details
 * Response from GET /api/v1/tenant/visitors/passes/{id}
 */
export interface VisitorPass {
  id: string;
  unitId: string;
  unitNumber?: string;
  blockName?: string;
  visitType: VisitorType | string;
  source: VisitorSource | string;
  accessCode?: string;
  requestedForUserId?: string;
  requestedForUserName?: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdType?: string;
  visitorIdNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  deliveryProvider?: string;
  notes?: string;
  expectedFrom?: string;
  expectedTo?: string;
  expiresAt?: string;
  checkInAt?: string;
  checkOutAt?: string;
  checkInByUserId?: string;
  checkInByUserName?: string;
  checkOutByUserId?: string;
  checkOutByUserName?: string;
  status: VisitorPassStatus | string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  rejectedByUserId?: string;
  rejectedByUserName?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  notifyVisitorAtGate: boolean;
  createdAt: string;
  createdBy?: string;
  createdByUserName?: string;
}

/**
 * Summary visitor pass for list views
 * Response from GET /api/v1/tenant/visitors/passes (paginated)
 */
export interface VisitorPassSummary {
  id: string;
  unitNumber?: string;
  blockName?: string;
  visitType: VisitorType | string;
  source: VisitorSource | string;
  accessCode?: string;
  visitorName: string;
  visitorPhone?: string;
  deliveryProvider?: string;
  expectedFrom?: string;
  expectedTo?: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: VisitorPassStatus | string;
  createdAt: string;
}

// ============================================
// Request DTOs
// ============================================

/**
 * Request body for creating a pre-registered visitor pass
 */
export interface CreateVisitorPassRequest {
  unitId: string;
  visitorName: string;
  visitType?: VisitorType;
  visitorPhone?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  deliveryProvider?: string;
  notes?: string;
  expectedFrom?: string;
  expectedTo?: string;
  notifyVisitorAtGate?: boolean;
}

/**
 * Result from creating a visitor pass
 */
export interface CreateVisitorPassResult {
  id: string;
  accessCode: string;
}

/**
 * Request body for creating a walk-in visitor pass (security guard flow)
 */
export interface CreateWalkInPassRequest {
  unitId: string;
  visitorName: string;
  visitType?: VisitorType;
  visitorPhone?: string;
  visitorIdType?: string;
  visitorIdNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  deliveryProvider?: string;
  notes?: string;
}

/**
 * Request body for updating a visitor pass
 */
export interface UpdateVisitorPassRequest {
  visitorName: string;
  visitorPhone?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  notes?: string;
}

/**
 * Request body for rejecting a visitor pass
 */
export interface RejectVisitorPassRequest {
  reason?: string;
}

/**
 * Query parameters for listing visitor passes
 */
export interface ListVisitorPassesParams {
  searchTerm?: string;
  unitId?: string;
  status?: VisitorPassStatus | string;
  visitType?: VisitorType | string;
  source?: VisitorSource | string;
  fromDate?: string;
  toDate?: string;
  currentlyInside?: boolean;
  page?: number;
  pageSize?: number;
}

// ============================================
// Date/Time Helpers
// Re-exported from maintenance to avoid barrel export conflicts in types/index.ts
// ============================================

export { formatDateTime, formatDate } from './maintenance';

