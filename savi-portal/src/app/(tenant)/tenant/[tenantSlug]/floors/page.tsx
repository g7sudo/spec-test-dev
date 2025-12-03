'use client';

/**
 * Floors Management Page
 * Manage floors in the community structure
 * Can be filtered by block from query params
 * Permission: TENANT_COMMUNITY_VIEW (view) / TENANT_COMMUNITY_MANAGE (create/edit)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Layers,
  Building,
  MoreVertical,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home,
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
import { listBlocks, listFloors } from '@/lib/api/community';
import { Block, Floor } from '@/types/community';
import { FloorFormDialog } from '@/components/community';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 100;

// ============================================
// Floor Row Component
// ============================================

interface FloorRowProps {
  floor: Floor;
  tenantSlug: string;
  canManage: boolean;
  onEdit: () => void;
}

function FloorRow({ floor, tenantSlug, canManage, onEdit }: FloorRowProps) {
  const router = useRouter();

  const handleViewUnits = () => {
    router.push(`/tenant/${tenantSlug}/units?blockId=${floor.blockId}&floorId=${floor.id}`);
  };

  return (
    <tr className="hover:bg-surface-50 transition-colors">
      {/* Floor Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{floor.name}</p>
            <p className="text-sm text-gray-500">Level {floor.levelNumber}</p>
          </div>
        </div>
      </td>

      {/* Block */}
      <td className="px-4 py-3">
        <Link
          href={`/tenant/${tenantSlug}/blocks`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
        >
          <Building className="h-3.5 w-3.5" />
          {floor.blockName}
        </Link>
      </td>

      {/* Order */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {floor.displayOrder}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            floor.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {floor.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewUnits}
          >
            <Home className="h-4 w-4" />
            Units
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewUnits}>
                View Units
              </DropdownMenuItem>
              {canManage && (
                <DropdownMenuItem onClick={onEdit}>
                  Edit Floor
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
  hasBlockFilter: boolean;
}

function EmptyState({ canManage, onCreateClick, hasBlockFilter }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Layers className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {hasBlockFilter ? 'No floors in this block' : 'No floors yet'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasBlockFilter
          ? 'Add floors to this block to organize units.'
          : 'Create floors within blocks to organize your units.'}
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Floor
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function FloorsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();

  // Get block filter from URL
  const blockIdFromUrl = searchParams.get('blockId');

  // Guard against double fetch in Strict Mode
  const fetchedRef = useRef(false);

  // Data state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBlockId, setFilterBlockId] = useState<string>(blockIdFromUrl || 'all');
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_COMMUNITY_MANAGE'] === true;

  // Load data
  const fetchData = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const [blocksResult, floorsResult] = await Promise.all([
        listBlocks({ pageSize: 100 }),
        listFloors({
          blockId: filterBlockId !== 'all' ? filterBlockId : undefined,
          pageSize: PAGE_SIZE,
        }),
      ]);

      setBlocks(blocksResult.items);
      setFloors(floorsResult.items);
    } catch (err) {
      console.error('Failed to fetch floors:', err);
      setError('Failed to load floors');
    } finally {
      setIsLoading(false);
    }
  }, [filterBlockId]);

  useEffect(() => {
    fetchedRef.current = false; // Reset guard when filter changes
    fetchData();
  }, [fetchData]);

  // Handle block filter change
  const handleBlockChange = (value: string) => {
    setFilterBlockId(value);
    // Update URL without full navigation
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete('blockId');
    } else {
      url.searchParams.set('blockId', value);
    }
    router.replace(url.pathname + url.search);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingFloor(null);
    fetchData(true);
  };

  // Get selected block name for header
  const selectedBlock = filterBlockId !== 'all'
    ? blocks.find(b => b.id === filterBlockId)
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb (when filtered by block) */}
      {selectedBlock && (
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={`/tenant/${tenantSlug}/blocks`}
            className="text-gray-500 hover:text-primary-600 transition-colors"
          >
            Blocks
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{selectedBlock.name}</span>
        </nav>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedBlock ? `Floors in ${selectedBlock.name}` : 'Floors'}
          </h1>
          <p className="text-sm text-gray-500">
            {selectedBlock
              ? 'Manage floors in this block'
              : 'Manage all floors across blocks'}
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Floor
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 sm:max-w-[250px]">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                <Building className="inline h-3.5 w-3.5 mr-1" />
                Filter by Block
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
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card noPadding>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading floors...</p>
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
                onClick={() => fetchData(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : floors.length === 0 ? (
          <CardContent>
            <EmptyState
              canManage={canManage}
              onCreateClick={() => setIsCreateOpen(true)}
              hasBlockFilter={filterBlockId !== 'all'}
            />
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                <tr>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Block</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {floors.map((floor) => (
                  <FloorRow
                    key={floor.id}
                    floor={floor}
                    tenantSlug={tenantSlug}
                    canManage={canManage}
                    onEdit={() => setEditingFloor(floor)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Floor Form Dialog */}
      <FloorFormDialog
        open={isCreateOpen || !!editingFloor}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingFloor(null);
          }
        }}
        floor={editingFloor}
        blocks={blocks}
        defaultBlockId={filterBlockId !== 'all' ? filterBlockId : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

