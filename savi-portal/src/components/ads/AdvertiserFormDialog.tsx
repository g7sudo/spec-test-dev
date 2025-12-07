'use client';

/**
 * Advertiser Form Dialog
 * Create or edit an advertiser for the ads platform
 */

import { useState, useEffect } from 'react';
import { Building, Save, Mail, Phone, User, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAdvertiser, updateAdvertiser } from '@/lib/api/ads';
import { Advertiser, CreateAdvertiserRequest, UpdateAdvertiserRequest } from '@/types/ads';

// ============================================
// Props
// ============================================

interface AdvertiserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertiser?: Advertiser | null; // null = create mode
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function AdvertiserFormDialog({
  open,
  onOpenChange,
  advertiser,
  onSuccess,
}: AdvertiserFormDialogProps) {
  const isEditing = !!advertiser;

  // Form state
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or advertiser changes
  useEffect(() => {
    if (open) {
      if (advertiser) {
        setName(advertiser.name);
        setContactName(advertiser.contactName || '');
        setContactEmail(advertiser.contactEmail || '');
        setContactPhone(advertiser.contactPhone || '');
        setNotes(advertiser.notes || '');
      } else {
        // Reset to defaults
        setName('');
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setNotes('');
      }
      setError(null);
    }
  }, [open, advertiser]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && advertiser) {
        const request: UpdateAdvertiserRequest = {
          name,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          notes: notes || null,
        };
        await updateAdvertiser(advertiser.id, request);
      } else {
        const request: CreateAdvertiserRequest = {
          name,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          notes: notes || null,
        };
        await createAdvertiser(request);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save advertiser:', err);
      const message = err instanceof Error ? err.message : 'Failed to save advertiser';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary-600" />
          {isEditing ? 'Edit Advertiser' : 'Create New Advertiser'}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Business Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Business Information
            </h3>

            <Input
              label="Business Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. XYZ Laundry Services"
              required
              leftAddon={<Building className="h-4 w-4" />}
            />
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wider">
              <User className="h-4 w-4" />
              Contact Details
            </h3>

            <Input
              label="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Full name"
              leftAddon={<User className="h-4 w-4" />}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                leftAddon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+971 50 000 0000"
                leftAddon={<Phone className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wider">
              <FileText className="h-4 w-4" />
              Notes
            </h3>

            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this advertiser..."
              rows={3}
            />
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
              {isEditing ? 'Save Changes' : 'Create Advertiser'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

