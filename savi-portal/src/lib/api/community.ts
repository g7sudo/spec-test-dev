/**
 * Community Structure API functions
 * Handles tenant-level community CRUD operations (Blocks, Floors, Units, Parking)
 */

import { httpClient } from '@/lib/http';
import {
  Block,
  Floor,
  Unit,
  UnitType,
  UnitParty,
  ParkingSlot,
  PagedResult,
  ListBlocksParams,
  ListFloorsParams,
  ListUnitsParams,
  ListUnitTypesParams,
  ListParkingSlotsParams,
  CreateBlockRequest,
  UpdateBlockRequest,
  CreateFloorRequest,
  UpdateFloorRequest,
  CreateUnitRequest,
  UpdateUnitRequest,
  CreateParkingSlotRequest,
  UpdateParkingSlotRequest,
  AllocateParkingSlotRequest,
} from '@/types/community';

// ============================================
// API Endpoints
// ============================================

const BLOCKS_BASE = '/api/v1/tenant/community/blocks';
const FLOORS_BASE = '/api/v1/tenant/community/floors';
const UNITS_BASE = '/api/v1/tenant/community/units';
const UNIT_TYPES_BASE = '/api/v1/tenant/community/unit-types';
const PARKING_BASE = '/api/v1/tenant/community/parking-slots';

// ============================================
// Block CRUD
// ============================================

/**
 * Lists blocks with pagination
 */
export async function listBlocks(
  params: ListBlocksParams = {}
): Promise<PagedResult<Block>> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query ? `${BLOCKS_BASE}?${query}` : BLOCKS_BASE;
  
  return httpClient.get<PagedResult<Block>>(url);
}

/**
 * Gets a block by ID
 */
export async function getBlockById(id: string): Promise<Block> {
  return httpClient.get<Block>(`${BLOCKS_BASE}/${id}`);
}

/**
 * Creates a new block
 */
export async function createBlock(data: CreateBlockRequest): Promise<string> {
  return httpClient.post<string>(BLOCKS_BASE, data);
}

/**
 * Updates an existing block
 */
export async function updateBlock(id: string, data: UpdateBlockRequest): Promise<void> {
  return httpClient.put<void>(`${BLOCKS_BASE}/${id}`, data);
}

// ============================================
// Floor CRUD
// ============================================

/**
 * Lists floors with pagination and optional block filter
 */
export async function listFloors(
  params: ListFloorsParams = {}
): Promise<PagedResult<Floor>> {
  const searchParams = new URLSearchParams();
  
  if (params.blockId) searchParams.set('blockId', params.blockId);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query ? `${FLOORS_BASE}?${query}` : FLOORS_BASE;
  
  return httpClient.get<PagedResult<Floor>>(url);
}

/**
 * Gets a floor by ID
 */
export async function getFloorById(id: string): Promise<Floor> {
  return httpClient.get<Floor>(`${FLOORS_BASE}/${id}`);
}

/**
 * Creates a new floor
 */
export async function createFloor(data: CreateFloorRequest): Promise<string> {
  return httpClient.post<string>(FLOORS_BASE, data);
}

/**
 * Updates an existing floor
 */
export async function updateFloor(id: string, data: UpdateFloorRequest): Promise<void> {
  return httpClient.put<void>(`${FLOORS_BASE}/${id}`, data);
}

// ============================================
// Unit Type CRUD
// ============================================

/**
 * Lists unit types with pagination
 */
export async function listUnitTypes(
  params: ListUnitTypesParams = {}
): Promise<PagedResult<UnitType>> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query ? `${UNIT_TYPES_BASE}?${query}` : UNIT_TYPES_BASE;
  
  return httpClient.get<PagedResult<UnitType>>(url);
}

// ============================================
// Unit CRUD
// ============================================

/**
 * Lists units with pagination and filters
 */
export async function listUnits(
  params: ListUnitsParams = {}
): Promise<PagedResult<Unit>> {
  const searchParams = new URLSearchParams();
  
  if (params.blockId) searchParams.set('blockId', params.blockId);
  if (params.floorId) searchParams.set('floorId', params.floorId);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query ? `${UNITS_BASE}?${query}` : UNITS_BASE;
  
  return httpClient.get<PagedResult<Unit>>(url);
}

/**
 * Gets a unit by ID
 */
export async function getUnitById(id: string): Promise<Unit> {
  return httpClient.get<Unit>(`${UNITS_BASE}/${id}`);
}

/**
 * Creates a new unit
 */
export async function createUnit(data: CreateUnitRequest): Promise<string> {
  return httpClient.post<string>(UNITS_BASE, data);
}

/**
 * Updates an existing unit
 */
export async function updateUnit(id: string, data: UpdateUnitRequest): Promise<void> {
  return httpClient.put<void>(`${UNITS_BASE}/${id}`, data);
}

/**
 * Gets all parties associated with a unit (residents and owners)
 * Returns current residents from active leases and current owners
 */
export async function getUnitParties(unitId: string): Promise<UnitParty[]> {
  return httpClient.get<UnitParty[]>(`${UNITS_BASE}/${unitId}/parties`);
}

// ============================================
// Parking Slot CRUD
// ============================================

/**
 * Lists parking slots with pagination and filters
 */
export async function listParkingSlots(
  params: ListParkingSlotsParams = {}
): Promise<PagedResult<ParkingSlot>> {
  const searchParams = new URLSearchParams();
  
  if (params.allocatedUnitId) searchParams.set('allocatedUnitId', params.allocatedUnitId);
  if (params.status !== undefined) searchParams.set('status', params.status.toString());
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query ? `${PARKING_BASE}?${query}` : PARKING_BASE;
  
  return httpClient.get<PagedResult<ParkingSlot>>(url);
}

/**
 * Gets a parking slot by ID
 */
export async function getParkingSlotById(id: string): Promise<ParkingSlot> {
  return httpClient.get<ParkingSlot>(`${PARKING_BASE}/${id}`);
}

/**
 * Creates a new parking slot
 */
export async function createParkingSlot(data: CreateParkingSlotRequest): Promise<string> {
  return httpClient.post<string>(PARKING_BASE, data);
}

/**
 * Updates an existing parking slot
 */
export async function updateParkingSlot(id: string, data: UpdateParkingSlotRequest): Promise<void> {
  return httpClient.put<void>(`${PARKING_BASE}/${id}`, data);
}

/**
 * Allocates a parking slot to a unit
 */
export async function allocateParkingSlot(
  slotId: string,
  data: AllocateParkingSlotRequest
): Promise<void> {
  return httpClient.post<void>(`${PARKING_BASE}/${slotId}/allocate`, data);
}

/**
 * Deallocates a parking slot from its current unit
 */
export async function deallocateParkingSlot(slotId: string): Promise<void> {
  return httpClient.post<void>(`${PARKING_BASE}/${slotId}/deallocate`, {});
}

