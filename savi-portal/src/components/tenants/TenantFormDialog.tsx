'use client';

/**
 * Tenant Form Dialog
 * Create or edit a tenant (community)
 */

import { useState, useEffect } from 'react';
import { Building2, Save, MapPin, User, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTenant, updateTenant } from '@/lib/api/tenants';
import {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '@/types/tenant';

// ============================================
// Props
// ============================================

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null; // null = create mode
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function TenantFormDialog({
  open,
  onOpenChange,
  tenant,
  onSuccess,
}: TenantFormDialogProps) {
  const isEditing = !!tenant;

  // Form state - Basic info
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  
  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [timezone, setTimezone] = useState('');
  
  // Primary contact
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [primaryContactPhone, setPrimaryContactPhone] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or tenant changes
  useEffect(() => {
    if (open) {
      if (tenant) {
        setName(tenant.name);
        setCode(tenant.code || '');
        setAddressLine1(tenant.addressLine1 || '');
        setAddressLine2(tenant.addressLine2 || '');
        setCity(tenant.city || '');
        setState(tenant.state || '');
        setCountry(tenant.country || '');
        setPostalCode(tenant.postalCode || '');
        setTimezone(tenant.timezone || '');
        setPrimaryContactName(tenant.primaryContactName || '');
        setPrimaryContactEmail(tenant.primaryContactEmail || '');
        setPrimaryContactPhone(tenant.primaryContactPhone || '');
      } else {
        // Reset to defaults
        setName('');
        setCode('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setCountry('');
        setPostalCode('');
        setTimezone('');
        setPrimaryContactName('');
        setPrimaryContactEmail('');
        setPrimaryContactPhone('');
      }
      setError(null);
    }
  }, [open, tenant]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && tenant) {
        const request: UpdateTenantRequest = {
          name,
          code: code || null,
          addressLine1: addressLine1 || null,
          addressLine2: addressLine2 || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: postalCode || null,
          timezone: timezone || null,
          primaryContactName: primaryContactName || null,
          primaryContactEmail: primaryContactEmail || null,
          primaryContactPhone: primaryContactPhone || null,
        };
        await updateTenant(tenant.id, request);
      } else {
        const request: CreateTenantRequest = {
          name,
          code: code || null,
          addressLine1: addressLine1 || null,
          addressLine2: addressLine2 || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: postalCode || null,
          timezone: timezone || null,
          primaryContactName: primaryContactName || null,
          primaryContactEmail: primaryContactEmail || null,
          primaryContactPhone: primaryContactPhone || null,
          // Default provisioning options
          provisionTenantDatabase: true,
          seedTenantRbac: true,
        };
        await createTenant(request);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save tenant:', err);
      setError(err.message || 'Failed to save tenant');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          {isEditing ? 'Edit Community' : 'Create New Community'}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Community Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Green Meadows"
                required
              />
              <Input
                label="Code / Slug"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. green-meadows"
                disabled={isEditing}
                hint={isEditing ? 'Cannot be changed after creation' : 'Auto-generated if left empty'}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wider">
              <MapPin className="h-4 w-4" />
              Address
            </h3>
            
            <Input
              label="Address Line 1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street address"
            />
            <Input
              label="Address Line 2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apt, suite, unit, etc."
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
              <Input
                label="State / Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
              <Input
                label="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12345"
              />
              <Input
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="America/New_York"
              />
            </div>
          </div>

          {/* Primary Contact Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wider">
              <User className="h-4 w-4" />
              Primary Contact
            </h3>
            
            <Input
              label="Contact Name"
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
              placeholder="Full name"
              leftAddon={<User className="h-4 w-4" />}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                type="email"
                value={primaryContactEmail}
                onChange={(e) => setPrimaryContactEmail(e.target.value)}
                placeholder="email@example.com"
                leftAddon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Contact Phone"
                value={primaryContactPhone}
                onChange={(e) => setPrimaryContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                leftAddon={<Phone className="h-4 w-4" />}
              />
            </div>
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
              {isEditing ? 'Save Changes' : 'Create Community'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

