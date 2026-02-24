'use client';

/**
 * Party Form Dialog
 * Create or edit a party (Individual, Company, Entity)
 */

import { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Save, Plus, Trash2 } from 'lucide-react';
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
import { createParty, updateParty } from '@/lib/api/parties';
import {
  Party,
  PartyType,
  PartyContactType,
  CreatePartyRequest,
  CreatePartyContactItem,
  UpdatePartyRequest,
  getContactTypeLabel,
} from '@/types/party';

// ============================================
// Props
// ============================================

interface PartyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party?: Party | null; // null = create mode
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function PartyFormDialog({
  open,
  onOpenChange,
  party,
  onSuccess,
}: PartyFormDialogProps) {
  const isEditing = !!party;

  // Default contact row for new parties
  const emptyContact: CreatePartyContactItem = {
    contactType: PartyContactType.Email,
    value: '',
    isPrimary: true,
  };

  // Form state
  const [partyType, setPartyType] = useState<PartyType>(PartyType.Individual);
  const [partyName, setPartyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [contacts, setContacts] = useState<CreatePartyContactItem[]>([emptyContact]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or party changes
  useEffect(() => {
    if (open) {
      if (party) {
        setPartyType(party.partyType);
        setPartyName(party.partyName);
        setLegalName(party.legalName || '');
        setFirstName(party.firstName || '');
        setLastName(party.lastName || '');
        setDateOfBirth(party.dateOfBirth || '');
        setRegistrationNumber(party.registrationNumber || '');
        setTaxNumber(party.taxNumber || '');
        setNotes(party.notes || '');
      } else {
        // Reset to defaults for create mode
        setPartyType(PartyType.Individual);
        setPartyName('');
        setLegalName('');
        setFirstName('');
        setLastName('');
        setDateOfBirth('');
        setRegistrationNumber('');
        setTaxNumber('');
        setNotes('');
        setContacts([{ ...emptyContact }]);
      }
      setError(null);
    }
  }, [open, party]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && party) {
        const request: UpdatePartyRequest = {
          partyName,
          legalName: legalName || null,
          firstName: firstName || null,
          lastName: lastName || null,
          dateOfBirth: dateOfBirth || null,
          registrationNumber: registrationNumber || null,
          taxNumber: taxNumber || null,
          notes: notes || null,
        };
        await updateParty(party.id, request);
      } else {
        // Filter out contacts with empty values
        const validContacts = contacts.filter(c => c.value.trim());
        if (validContacts.length === 0) {
          setError('At least one contact is required.');
          setIsSaving(false);
          return;
        }

        const request: CreatePartyRequest = {
          partyType,
          partyName,
          legalName: legalName || null,
          firstName: firstName || null,
          lastName: lastName || null,
          dateOfBirth: dateOfBirth || null,
          registrationNumber: registrationNumber || null,
          taxNumber: taxNumber || null,
          notes: notes || null,
          contacts: validContacts,
        };
        await createParty(request);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save party:', err);
      setError(err.message || 'Failed to save party');
    } finally {
      setIsSaving(false);
    }
  };

  const isIndividual = partyType === PartyType.Individual;
  const isCompanyOrEntity = partyType === PartyType.Company || partyType === PartyType.Entity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col">
        <DialogTitle>
          {isEditing ? 'Edit Party' : 'Create New Party'}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Party Type (only for create) */}
          {!isEditing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Party Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: PartyType.Individual, icon: User, label: 'Individual' },
                  { type: PartyType.Company, icon: Building2, label: 'Company' },
                  { type: PartyType.Entity, icon: Briefcase, label: 'Entity' },
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPartyType(type)}
                    className={`
                      flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-medium
                      transition-colors
                      ${partyType === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Display Name */}
          <Input
            label="Display Name *"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder={isIndividual ? 'e.g. John Doe' : 'e.g. ABC Corp'}
            required
          />

          {/* Individual Fields */}
          {isIndividual && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          )}

          {isIndividual && (
            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          )}

          {/* Company/Entity Fields */}
          {isCompanyOrEntity && (
            <>
              <Input
                label="Legal Name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Registered legal name"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Registration Number"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Business reg. no."
                />
                <Input
                  label="Tax Number"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="Tax ID"
                />
              </div>
            </>
          )}

          {/* Contacts (mandatory for create) */}
          {!isEditing && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Contacts *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setContacts([
                      ...contacts,
                      { contactType: PartyContactType.Email, value: '', isPrimary: false },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Contact
                </button>
              </div>
              <div className="space-y-3">
                {contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    {/* Row 1: Type dropdown + Remove button */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={contact.contactType}
                        onValueChange={(val) => {
                          const updated = [...contacts];
                          updated[idx] = { ...updated[idx], contactType: val as PartyContactType };
                          setContacts(updated);
                        }}
                      >
                        <SelectTrigger className="flex-1">
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

                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Row 2: Value input */}
                    <div className="mt-2">
                      <Input
                        value={contact.value}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setContacts(updated);
                        }}
                        placeholder={
                          contact.contactType === PartyContactType.Email
                            ? 'email@example.com'
                            : '+971 50 123 4567'
                        }
                      />
                    </div>

                    {/* Row 3: Primary checkbox */}
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={contact.isPrimary}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx] = { ...updated[idx], isPrimary: e.target.checked };
                          setContacts(updated);
                        }}
                        className="rounded border-gray-300"
                      />
                      Primary contact
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          </div>

          {/* Error + Actions pinned at the bottom */}
          <div className="shrink-0 border-t border-gray-100 pt-3 mt-3">
            {error && (
              <p className="mb-3 text-sm text-error">{error}</p>
            )}
            <div className="flex justify-end gap-3">
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
                {isEditing ? 'Save Changes' : 'Create Party'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

