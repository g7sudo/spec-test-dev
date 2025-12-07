'use client';

/**
 * Assign Maintenance Request Dialog
 * Allows supervisor to assign a request to a technician
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { listTenantRbacUsers } from '@/lib/api/tenant-rbac';
import { assignMaintenanceRequest } from '@/lib/api/maintenance';
import { CommunityUserRbac } from '@/types/rbac';

// ============================================
// Props
// ============================================

interface AssignRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  currentAssigneeId?: string | null;
}

// ============================================
// Component
// ============================================

export function AssignRequestDialog({
  open,
  onClose,
  onSuccess,
  requestId,
  currentAssigneeId,
}: AssignRequestDialogProps) {
  // Refs for Strict Mode guard
  const usersFetchedRef = useRef(false);

  // Data state
  const [users, setUsers] = useState<CommunityUserRbac[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState(currentAssigneeId || '');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Load Users
  // ============================================

  const loadUsers = useCallback(async (force = false) => {
    if (!force && usersFetchedRef.current) return;
    usersFetchedRef.current = true;

    setIsLoadingUsers(true);
    try {
      // Load community users - ideally would filter by maintenance role
      const result = await listTenantRbacUsers({ pageSize: 200 });
      setUsers(result.items);
    } catch (err) {
      console.error('Failed to load users:', err);
      usersFetchedRef.current = false;
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (open) {
      loadUsers();
      setSelectedUserId(currentAssigneeId || '');
      setError(null);
    } else {
      usersFetchedRef.current = false;
    }
  }, [open, loadUsers, currentAssigneeId]);

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError('Please select a technician');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await assignMaintenanceRequest(requestId, { assignedToUserId: selectedUserId });
      onSuccess();
    } catch (err) {
      console.error('Failed to assign request:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Technician</DialogTitle>
        </DialogHeader>

        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Assign To *
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.preferredName || user.partyName || 'Unnamed User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select the maintenance staff member to handle this request
              </p>
            </div>

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
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingUsers || !selectedUserId}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

