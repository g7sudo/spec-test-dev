/**
 * Community Structure Types
 * Types for Blocks, Floors, Units, and Parking Slots
 * Maps to backend DTOs from Savi.Application.Tenant.Community
 */

// Re-export PagedResult from http.ts to avoid duplication
export type { PagedResult } from './http';

// ============================================
// Enums (values match C# enum integers)
// ============================================

/**
 * Unit status in the community
 */
export enum UnitStatus {
  Vacant = 0,
  Occupied = 1,
  UnderMaintenance = 2,
}

/**
 * Parking slot status
 */
export enum ParkingStatus {
  Available = 0,
  Occupied = 1,
  UnderMaintenance = 2,
}

/**
 * Parking location type
 */
export enum ParkingLocationType {
  Underground = 0,
  Surface = 1,
  Covered = 2,
  Street = 3,
}

// ============================================
// Block DTOs
// ============================================

/**
 * Block entity response
 */
export interface Block {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create block request
 */
export interface CreateBlockRequest {
  name: string;
  description?: string | null;
  displayOrder?: number;
}

/**
 * Update block request
 */
export interface UpdateBlockRequest {
  name: string;
  description?: string | null;
  displayOrder?: number;
}

// ============================================
// Floor DTOs
// ============================================

/**
 * Floor entity response
 */
export interface Floor {
  id: string;
  blockId: string;
  blockName: string | null;
  name: string;
  levelNumber: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create floor request
 */
export interface CreateFloorRequest {
  blockId: string;
  name: string;
  levelNumber: number;
  displayOrder?: number;
}

/**
 * Update floor request
 */
export interface UpdateFloorRequest {
  name: string;
  levelNumber: number;
  displayOrder?: number;
}

// ============================================
// Unit DTOs
// ============================================

/**
 * Unit entity response
 */
export interface Unit {
  id: string;
  blockId: string;
  blockName: string | null;
  floorId: string;
  floorName: string | null;
  unitTypeId: string;
  unitTypeName: string | null;
  unitNumber: string;
  areaSqft: number | null;
  status: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create unit request
 */
export interface CreateUnitRequest {
  blockId: string;
  floorId: string;
  unitTypeId: string;
  unitNumber: string;
  areaSqft?: number | null;
  status?: UnitStatus;
  notes?: string | null;
  imageUploadIds?: string[] | null;
}

/**
 * Update unit request
 */
export interface UpdateUnitRequest {
  unitTypeId: string;
  unitNumber: string;
  areaSqft?: number | null;
  status?: UnitStatus;
  notes?: string | null;
}

// ============================================
// Unit Party DTOs
// ============================================

/**
 * Association type for unit party
 */
export type UnitPartyAssociationType = 'Resident' | 'Owner';

/**
 * Role of party in unit
 */
export type UnitPartyRole = 'PrimaryResident' | 'CoResident' | 'PrimaryOwner' | 'CoOwner';

/**
 * Party associated with a unit (resident or owner)
 * Returned from GET /api/v1/tenant/community/units/{unitId}/parties
 */
export interface UnitParty {
  partyId: string;
  partyName: string;
  partyType: string;
  associationType: UnitPartyAssociationType;
  role: UnitPartyRole;
  isPrimary: boolean;
  email: string | null;
  phone: string | null;
}

// ============================================
// Parking Slot DTOs
// ============================================

/**
 * Parking slot entity response
 */
export interface ParkingSlot {
  id: string;
  code: string;
  locationType: string;
  levelLabel: string | null;
  isCovered: boolean;
  isEVCompatible: boolean;
  status: string;
  notes: string | null;
  allocatedUnitId: string | null;
  allocatedUnitNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create parking slot request
 */
export interface CreateParkingSlotRequest {
  code: string;
  locationType: ParkingLocationType;
  levelLabel?: string | null;
  isCovered?: boolean;
  isEVCompatible?: boolean;
  status?: ParkingStatus;
  notes?: string | null;
}

/**
 * Update parking slot request
 */
export interface UpdateParkingSlotRequest {
  code: string;
  locationType: ParkingLocationType;
  levelLabel?: string | null;
  isCovered?: boolean;
  isEVCompatible?: boolean;
  notes?: string | null;
}

/**
 * Allocate parking slot to unit request
 */
export interface AllocateParkingSlotRequest {
  unitId: string;
}

// ============================================
// Unit Type DTOs
// ============================================

/**
 * Unit type entity response (e.g., Studio, 1BHK, 2BHK, Penthouse)
 */
export interface UnitType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultParkingSlots: number;
  defaultOccupancyLimit: number | null;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// List Query Params
// ============================================

export interface ListUnitTypesParams {
  page?: number;
  pageSize?: number;
}

export interface ListBlocksParams {
  page?: number;
  pageSize?: number;
}

export interface ListFloorsParams {
  blockId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListUnitsParams {
  blockId?: string;
  floorId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListParkingSlotsParams {
  allocatedUnitId?: string;
  status?: ParkingStatus;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for unit status
 */
export function getUnitStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'vacant':
      return 'Vacant';
    case 'occupied':
      return 'Occupied';
    case 'undermaintenance':
      return 'Under Maintenance';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes for unit status
 */
export function getUnitStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'vacant':
      return 'bg-green-100 text-green-700';
    case 'occupied':
      return 'bg-blue-100 text-blue-700';
    case 'undermaintenance':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for parking status
 */
export function getParkingStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'available':
      return 'Available';
    case 'occupied':
      return 'Allocated';
    case 'undermaintenance':
      return 'Under Maintenance';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes for parking status
 */
export function getParkingStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-700';
    case 'occupied':
      return 'bg-blue-100 text-blue-700';
    case 'undermaintenance':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for parking location type
 */
export function getParkingLocationTypeLabel(type: ParkingLocationType | string): string {
  const typeStr = typeof type === 'string' ? type.toLowerCase() : '';
  
  switch (type) {
    case ParkingLocationType.Underground:
    case 'underground':
      return 'Underground';
    case ParkingLocationType.Surface:
    case 'surface':
      return 'Surface';
    case ParkingLocationType.Covered:
    case 'covered':
      return 'Covered';
    case ParkingLocationType.Street:
    case 'street':
      return 'Street';
    default:
      return typeof type === 'string' ? type : 'Unknown';
  }
}

/**
 * Gets numeric enum value for parking location type string
 */
export function getParkingLocationTypeValue(type: string): ParkingLocationType {
  switch (type?.toLowerCase()) {
    case 'underground':
      return ParkingLocationType.Underground;
    case 'surface':
      return ParkingLocationType.Surface;
    case 'covered':
      return ParkingLocationType.Covered;
    case 'street':
      return ParkingLocationType.Street;
    default:
      return ParkingLocationType.Surface;
  }
}

/**
 * Gets numeric enum value for unit status string
 */
export function getUnitStatusValue(status: string): UnitStatus {
  switch (status?.toLowerCase()) {
    case 'vacant':
      return UnitStatus.Vacant;
    case 'occupied':
      return UnitStatus.Occupied;
    case 'undermaintenance':
      return UnitStatus.UnderMaintenance;
    default:
      return UnitStatus.Vacant;
  }
}

/**
 * Gets numeric enum value for parking status string
 */
export function getParkingStatusValue(status: string): ParkingStatus {
  switch (status?.toLowerCase()) {
    case 'available':
      return ParkingStatus.Available;
    case 'occupied':
      return ParkingStatus.Occupied;
    case 'undermaintenance':
      return ParkingStatus.UnderMaintenance;
    default:
      return ParkingStatus.Available;
  }
}

