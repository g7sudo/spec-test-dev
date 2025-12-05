'use client';

/**
 * Units List Page (F-UNIT-LIST-01)
 * Central entry point into the community structure
 * Shows all units with search, filter by block/floor, and pagination
 * Permission: TENANT_COMMUNITY_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Plus,
  Home,
  MoreVertical,
  Loader2,
  AlertCircle,
  Building,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listUnits, listBlocks, listFloors } from '@/lib/api/community';
import { Unit, Block, Floor, getUnitStatusLabel, getUnitStatusColor } from '@/types/community';
import { UnitFormDialog } from '@/components/community';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// Unit Row Component
// ============================================

interface UnitRowProps {
  unit: Unit;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
}

function UnitRow({ unit, canManage, onView, onEdit }: UnitRowProps) {
  return (
    <tr
      className="hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Unit Number */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{unit.unitNumber}</p>
            <p className="text-sm text-gray-500">{unit.unitTypeName || 'Standard'}</p>
          </div>
        </div>
      </td>

      {/* Block / Floor */}
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm text-gray-900">{unit.blockName}</p>
          <p className="text-xs text-gray-500">{unit.floorName}</p>
        </div>
      </td>

      {/* Area */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {unit.areaSqft ? `${unit.areaSqft.toLocaleString()} sqft` : '—'}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getUnitStatusColor(unit.status)}`}
        >
          {getUnitStatusLabel(unit.status)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              View Details
            </DropdownMenuItem>
            {canManage && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                Edit
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  canManage: boolean;
  onCreateClick: () => void;
}

function EmptyState({ canManage, onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Home className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No units yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first unit.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Unit
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function UnitsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();

  // Guards against double fetch in React Strict Mode
  // Each independent fetch needs its own guard ref
  const unitsFetchedRef = useRef(false);
  const filtersFetchedRef = useRef(false);

  // Data state
  const [units, setUnits] = useState<Unit[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [filterBlockId, setFilterBlockId] = useState<string>('all');
  const [filterFloorId, setFilterFloorId] = useState<string>('all');
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_COMMUNITY_VIEW'] === true;
  const canManage = permissions['TENANT_COMMUNITY_MANAGE'] === true;

  // Load blocks and floors for filters (with Strict Mode guard)
  const loadFilters = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && filtersFetchedRef.current) return;
    filtersFetchedRef.current = true;

    try {
      const [blocksResult, floorsResult] = await Promise.all([
        listBlocks({ pageSize: 100 }),
        listFloors({ pageSize: 100 }),
      ]);
      setBlocks(blocksResult.items);
      setFloors(floorsResult.items);
    } catch (err) {
      console.error('Failed to load filter options:', err);
      filtersFetchedRef.current = false; // Allow retry on error
    }
  }, []);

  // Load units (with Strict Mode guard)
  const fetchUnits = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && unitsFetchedRef.current) return;
    unitsFetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listUnits({
        page,
        pageSize: PAGE_SIZE,
        blockId: filterBlockId !== 'all' ? filterBlockId : undefined,
        floorId: filterFloorId !== 'all' ? filterFloorId : undefined,
      });

      setUnits(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch units:', err);
      setError('Failed to load units');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterBlockId, filterFloorId]);

  // Initial load - filters (runs once)
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Reset units guard when filter dependencies ACTUALLY change
  // This runs BEFORE the fetch effect due to React's execution order
  const prevDepsRef = useRef({ page, filterBlockId, filterFloorId });
  useEffect(() => {
    const prev = prevDepsRef.current;
    const changed = prev.page !== page || 
                    prev.filterBlockId !== filterBlockId || 
                    prev.filterFloorId !== filterFloorId;
    
    if (changed) {
      unitsFetchedRef.current = false; // Reset only on actual change
      prevDepsRef.current = { page, filterBlockId, filterFloorId };
    }
  }, [page, filterBlockId, filterFloorId]);

  // Fetch units - guard prevents double call in Strict Mode
  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Handle block filter change
  const handleBlockChange = (value: string) => {
    setFilterBlockId(value);
    setFilterFloorId('all'); // Reset floor when block changes
    setPage(1);
  };

  // Handle floor filter change
  const handleFloorChange = (value: string) => {
    setFilterFloorId(value);
    setPage(1);
  };

  // Get floors for selected block
  const filteredFloors = filterBlockId !== 'all'
    ? floors.filter(f => f.blockId === filterBlockId)
    : floors;

  // Navigate to unit detail
  const navigateToDetail = (unitId: string) => {
    router.push(`/tenant/${tenantSlug}/units/${unitId}`);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingUnit(null);
    fetchUnits(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Units</h1>
          <p className="text-sm text-gray-500">
            View and manage all units in your community
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Unit
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Block Filter */}
            <div className="flex-1 sm:max-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                <Building className="inline h-3.5 w-3.5 mr-1" />
                Block
              </label>
              <Select value={filterBlockId} onValueChange={handleBlockChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blocks</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Floor Filter */}
            <div className="flex-1 sm:max-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                <Layers className="inline h-3.5 w-3.5 mr-1" />
                Floor
              </label>
              <Select
                value={filterFloorId}
                onValueChange={handleFloorChange}
                disabled={filteredFloors.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {filteredFloors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name} {filterBlockId === 'all' && floor.blockName ? `(${floor.blockName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card noPadding>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading units...</p>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-3 font-medium text-gray-900">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchUnits(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : units.length === 0 ? (
          <CardContent>
            <EmptyState canManage={canManage} onCreateClick={() => setIsCreateOpen(true)} />
          </CardContent>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Area</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {units.map((unit) => (
                    <UnitRow
                      key={unit.id}
                      unit={unit}
                      canManage={canManage}
                      onView={() => navigateToDetail(unit.id)}
                      onEdit={() => setEditingUnit(unit)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <UnitFormDialog
        open={isCreateOpen || !!editingUnit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingUnit(null);
          }
        }}
        unit={editingUnit}
        blocks={blocks}
        defaultBlockId={filterBlockId !== 'all' ? filterBlockId : undefined}
        defaultFloorId={filterFloorId !== 'all' ? filterFloorId : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

