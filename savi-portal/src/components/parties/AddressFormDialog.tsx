'use client';

/**
 * Address Form Dialog
 * Add or edit a party address
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { addPartyAddress, updatePartyAddress } from '@/lib/api/parties';
import {
  PartyAddress,
  PartyAddressType,
  PartyAddressRequest,
  getAddressTypeLabel,
} from '@/types/party';

// ============================================
// Props
// ============================================

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId: string;
  address?: PartyAddress | null;
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function AddressFormDialog({
  open,
  onOpenChange,
  partyId,
  address,
  onSuccess,
}: AddressFormDialogProps) {
  const isEditing = !!address;

  // Form state
  const [addressType, setAddressType] = useState<PartyAddressType>(PartyAddressType.Permanent);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (address) {
        setAddressType(address.addressType);
        setLine1(address.line1);
        setLine2(address.line2 || '');
        setCity(address.city || '');
        setState(address.state || '');
        setCountry(address.country || '');
        setPostalCode(address.postalCode || '');
        setIsPrimary(address.isPrimary);
      } else {
        setAddressType(PartyAddressType.Permanent);
        setLine1('');
        setLine2('');
        setCity('');
        setState('');
        setCountry('');
        setPostalCode('');
        setIsPrimary(false);
      }
      setError(null);
    }
  }, [open, address]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const request: PartyAddressRequest = {
        addressType,
        line1,
        line2: line2 || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postalCode: postalCode || null,
        isPrimary,
      };

      if (isEditing && address) {
        await updatePartyAddress(partyId, address.id, request);
      } else {
        await addPartyAddress(partyId, request);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save address:', err);
      setError(err.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>
          {isEditing ? 'Edit Address' : 'Add Address'}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Address Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Address Type
            </label>
            <Select
              value={addressType.toString()}
              onValueChange={(v) => setAddressType(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    {getAddressTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Lines */}
          <Input
            label="Address Line 1 *"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Street address"
            required
          />

          <Input
            label="Address Line 2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Apt, suite, unit, etc."
          />

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State / Province"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          {/* Country & Postal */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input
              label="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>

          {/* Primary Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Set as primary address
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
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
              {isEditing ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

