'use client';

/**
 * Blocks Management Page
 * Manage blocks in the community structure (top-down hierarchy entry)
 * Permission: TENANT_COMMUNITY_VIEW (view) / TENANT_COMMUNITY_MANAGE (create/edit)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Plus,
  Building,
  MoreVertical,
  Loader2,
  AlertCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listBlocks, listFloors } from '@/lib/api/community';
import { Block, Floor } from '@/types/community';
import { BlockFormDialog, FloorFormDialog } from '@/components/community';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 50;

// ============================================
// Block Card Component
// ============================================

interface BlockCardProps {
  block: Block;
  floors: Floor[];
  canManage: boolean;
  onEdit: () => void;
  onViewFloors: () => void;
  onAddFloor: () => void;
}

function BlockCard({ block, floors, canManage, onEdit, onViewFloors, onAddFloor }: BlockCardProps) {
  const floorCount = floors.filter(f => f.blockId === block.id).length;

  return (
    <Card hoverable className="relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{block.name}</h3>
            <p className="text-sm text-gray-500">
              {floorCount} floor{floorCount !== 1 ? 's' : ''}
            </p>
            {block.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {block.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewFloors}>
              <Layers className="h-4 w-4 mr-2" />
              View Floors
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={onAddFloor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Floor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  Edit Block
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick action to view floors */}
      <button
        onClick={onViewFloors}
        className="mt-4 w-full flex items-center justify-between p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors text-sm"
      >
        <span className="text-gray-600">View floors in this block</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>
    </Card>
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
        <Building className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No blocks yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Start organizing your community by creating blocks.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Block
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function BlocksPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();

  // Guard against double fetch in Strict Mode
  const fetchedRef = useRef(false);

  // Data state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state
  const [isCreateBlockOpen, setIsCreateBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [isCreateFloorOpen, setIsCreateFloorOpen] = useState(false);
  const [selectedBlockForFloor, setSelectedBlockForFloor] = useState<string | undefined>();

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_COMMUNITY_MANAGE'] === true;

  // Load blocks and floors
  const fetchData = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const [blocksResult, floorsResult] = await Promise.all([
        listBlocks({ pageSize: PAGE_SIZE }),
        listFloors({ pageSize: 200 }),
      ]);

      setBlocks(blocksResult.items);
      setFloors(floorsResult.items);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
      setError('Failed to load blocks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate to floors filtered by block
  const handleViewFloors = (blockId: string) => {
    router.push(`/tenant/${tenantSlug}/floors?blockId=${blockId}`);
  };

  // Open add floor dialog for specific block
  const handleAddFloor = (blockId: string) => {
    setSelectedBlockForFloor(blockId);
    setIsCreateFloorOpen(true);
  };

  // Handle form success
  const handleBlockSuccess = () => {
    setIsCreateBlockOpen(false);
    setEditingBlock(null);
    fetchData(true);
  };

  const handleFloorSuccess = () => {
    setIsCreateFloorOpen(false);
    setSelectedBlockForFloor(undefined);
    fetchData(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blocks</h1>
          <p className="text-sm text-gray-500">
            Manage building blocks in your community
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateBlockOpen(true)}>
            <Plus className="h-4 w-4" />
            New Block
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-gray-500">Loading blocks...</p>
        </div>
      ) : error ? (
        <Card>
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
        </Card>
      ) : blocks.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState canManage={canManage} onCreateClick={() => setIsCreateBlockOpen(true)} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              floors={floors}
              canManage={canManage}
              onEdit={() => setEditingBlock(block)}
              onViewFloors={() => handleViewFloors(block.id)}
              onAddFloor={() => handleAddFloor(block.id)}
            />
          ))}
        </div>
      )}

      {/* Block Form Dialog */}
      <BlockFormDialog
        open={isCreateBlockOpen || !!editingBlock}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateBlockOpen(false);
            setEditingBlock(null);
          }
        }}
        block={editingBlock}
        onSuccess={handleBlockSuccess}
      />

      {/* Floor Form Dialog */}
      <FloorFormDialog
        open={isCreateFloorOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateFloorOpen(false);
            setSelectedBlockForFloor(undefined);
          }
        }}
        blocks={blocks}
        defaultBlockId={selectedBlockForFloor}
        onSuccess={handleFloorSuccess}
      />
    </div>
  );
}

