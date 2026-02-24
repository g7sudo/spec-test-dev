'use client';

/**
 * Contact Form Dialog
 * Add or edit a party contact
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
import { addPartyContact, updatePartyContact } from '@/lib/api/parties';
import {
  PartyContact,
  PartyContactType,
  PartyContactRequest,
  getContactTypeLabel,
} from '@/types/party';

// ============================================
// Props
// ============================================

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId: string;
  contact?: PartyContact | null;
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function ContactFormDialog({
  open,
  onOpenChange,
  partyId,
  contact,
  onSuccess,
}: ContactFormDialogProps) {
  const isEditing = !!contact;

  // Form state
  const [contactType, setContactType] = useState<PartyContactType>(PartyContactType.Email);
  const [value, setValue] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (contact) {
        setContactType(contact.contactType);
        setValue(contact.value);
        setIsPrimary(contact.isPrimary);
      } else {
        setContactType(PartyContactType.Email);
        setValue('');
        setIsPrimary(false);
      }
      setError(null);
    }
  }, [open, contact]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const request: PartyContactRequest = {
        contactType,
        value,
        isPrimary,
      };

      if (isEditing && contact) {
        await updatePartyContact(partyId, contact.id, request);
      } else {
        await addPartyContact(partyId, request);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save contact:', err);
      setError(err.message || 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  // Get placeholder based on type
  const getPlaceholder = () => {
    switch (contactType) {
      case PartyContactType.Email:
        return 'email@example.com';
      case PartyContactType.Mobile:
      case PartyContactType.Phone:
      case PartyContactType.Whatsapp:
        return '+1 234 567 8900';
      default:
        return 'Enter contact value';
    }
  };

  // Get input type based on contact type
  const getInputType = () => {
    switch (contactType) {
      case PartyContactType.Email:
        return 'email';
      case PartyContactType.Mobile:
      case PartyContactType.Phone:
      case PartyContactType.Whatsapp:
        return 'tel';
      default:
        return 'text';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>
          {isEditing ? 'Edit Contact' : 'Add Contact'}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Contact Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Contact Type
            </label>
            <Select
              value={contactType}
              onValueChange={(v) => setContactType(v as PartyContactType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PartyContactType).map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {getContactTypeLabel(ct)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          <Input
            label="Value *"
            type={getInputType()}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={getPlaceholder()}
            required
          />

          {/* Primary Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Set as primary contact
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
              {isEditing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

