'use client';

/**
 * Create Maintenance Request Dialog
 * Form to create a new maintenance request
 * Selects unit, category, party (resident/owner), title, description, priority
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Home, Tag, User, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { listUnits } from '@/lib/api/community';
import { listParties } from '@/lib/api/parties';
import {
  listMaintenanceCategories,
  createMaintenanceRequest,
} from '@/lib/api/maintenance';
import { Unit } from '@/types/community';
import { Party } from '@/types/party';
import {
  MaintenanceCategorySummary,
  MaintenancePriority,
  MaintenanceSource,
  MAINTENANCE_PRIORITY_OPTIONS,
} from '@/types/maintenance';

// ============================================
// Props
// ============================================

interface CreateMaintenanceRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Optional pre-selected values
  preselectedUnitId?: string;
  preselectedPartyId?: string;
}

// ============================================
// Component
// ============================================

export function CreateMaintenanceRequestDialog({
  open,
  onClose,
  onSuccess,
  preselectedUnitId,
  preselectedPartyId,
}: CreateMaintenanceRequestDialogProps) {
  // Refs for Strict Mode guard
  const unitsFetchedRef = useRef(false);
  const categoriesFetchedRef = useRef(false);
  const partiesFetchedRef = useRef(false);

  // Data state
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<MaintenanceCategorySummary[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [unitId, setUnitId] = useState(preselectedUnitId || '');
  const [categoryId, setCategoryId] = useState('');
  const [partyId, setPartyId] = useState(preselectedPartyId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>(MaintenancePriority.Normal);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Load Data
  // ============================================

  // Load units for selection
  const loadUnits = useCallback(async (force = false) => {
    if (!force && unitsFetchedRef.current) return;
    unitsFetchedRef.current = true;

    try {
      const result = await listUnits({ pageSize: 500 });
      setUnits(result.items);
    } catch (err) {
      console.error('Failed to load units:', err);
      unitsFetchedRef.current = false;
    }
  }, []);

  // Load categories for selection
  const loadCategories = useCallback(async (force = false) => {
    if (!force && categoriesFetchedRef.current) return;
    categoriesFetchedRef.current = true;

    try {
      const result = await listMaintenanceCategories({ pageSize: 100 });
      setCategories(result.items);
      // Auto-select default category if available
      const defaultCat = result.items.find((c) => c.isDefault);
      if (defaultCat && !categoryId) {
        setCategoryId(defaultCat.id);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      categoriesFetchedRef.current = false;
    }
  }, [categoryId]);

  // Load parties for selection
  const loadParties = useCallback(async (force = false) => {
    if (!force && partiesFetchedRef.current) return;
    partiesFetchedRef.current = true;

    try {
      const result = await listParties({ pageSize: 500 });
      setParties(result.items);
    } catch (err) {
      console.error('Failed to load parties:', err);
      partiesFetchedRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      Promise.all([loadUnits(), loadCategories(), loadParties()]).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [open, loadUnits, loadCategories, loadParties]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setUnitId(preselectedUnitId || '');
      setCategoryId('');
      setPartyId(preselectedPartyId || '');
      setTitle('');
      setDescription('');
      setPriority(MaintenancePriority.Normal);
      setError(null);
      // Reset fetch refs for next open
      unitsFetchedRef.current = false;
      categoriesFetchedRef.current = false;
      partiesFetchedRef.current = false;
    }
  }, [open, preselectedUnitId, preselectedPartyId]);

  // ============================================
  // Form Handlers
  // ============================================

  const handleSubmit = async () => {
    // Validation
    if (!unitId) {
      setError('Please select a unit');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!partyId) {
      setError('Please select who this request is for');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createMaintenanceRequest({
        unitId,
        categoryId,
        requestedForPartyId: partyId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        source: MaintenanceSource.AdminPortal,
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to create request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unit Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="h-4 w-4 inline mr-1" />
                Unit *
              </label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNumber}
                      {unit.blockName && ` • ${unit.blockName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="h-4 w-4 inline mr-1" />
                Category *
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Party Selection (who the request is for) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Request For (Resident/Owner) *
              </label>
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resident or owner" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.partyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                The resident or owner this maintenance request is for
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Leaking tap in kitchen"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about the issue..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MaintenancePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingData}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

