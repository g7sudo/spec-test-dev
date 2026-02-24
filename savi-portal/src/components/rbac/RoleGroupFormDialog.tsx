'use client';

/**
 * Role Group Form Dialog
 * Create a new role group in the tenant
 */

import { useState, useEffect } from 'react';
import { Shield, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { RoleGroupType, CreateRoleGroupRequest } from '@/types/rbac';
import { createTenantRoleGroup } from '@/lib/api/tenant-rbac';

// ============================================
// Props
// ============================================

interface RoleGroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback when role group is successfully created */
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function RoleGroupFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: RoleGroupFormDialogProps) {
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<RoleGroupType>(RoleGroupType.Custom);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setCode('');
      setDescription('');
      setGroupType(RoleGroupType.Custom);
      setError(null);
    }
  }, [open]);
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const request: CreateRoleGroupRequest = {
        name: name.trim(),
        code: code.trim() || null,
        description: description.trim() || null,
        groupType,
      };
      
      await createTenantRoleGroup(request);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to create role group:', err);
      setError(err.message || 'Failed to create role');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          Create New Role
        </DialogTitle>
        
        <DialogDescription className="text-gray-600">
          Create a custom role group with specific permissions for your community.
        </DialogDescription>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <Input
            label="Role Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Security Guard"
            required
            autoFocus
          />
          
          {/* Code */}
          <Input
            label="Code (optional)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SECURITY_GUARD"
            helperText="Auto-generated from name if left empty"
          />
          
          {/* Description */}
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this role's purpose"
          />
          
          {/* Group Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role Type</label>
            <Select
              value={groupType.toString()}
              onValueChange={(val) => setGroupType(parseInt(val) as RoleGroupType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RoleGroupType.Staff.toString()}>
                  Staff
                </SelectItem>
                <SelectItem value={RoleGroupType.Custom.toString()}>
                  Custom
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Staff roles are for community employees; Custom for other purposes.
            </p>
          </div>
          
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              <Save className="h-4 w-4" />
              Create Role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

