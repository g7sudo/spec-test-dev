'use client';

/**
 * Add Lease Party Dialog
 * Used for adding a party to an existing lease (Flow 4, Step 2)
 * Allows selecting existing party or creating new one
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  User,
  Building2,
  Briefcase,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { listParties, createParty } from '@/lib/api/parties';
import { addLeaseParty } from '@/lib/api/leases';
import { Party, PartyType, getPartyTypeLabel } from '@/types/party';
import {
  LeaseParty,
  LeasePartyRole,
  getLeasePartyRoleLabel,
} from '@/types/lease';

// ============================================
// Types
// ============================================

interface AddLeasePartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lease ID to add party to */
  leaseId: string;
  /** Lease start date for default move-in */
  leaseStartDate: string;
  /** Existing parties on the lease */
  existingParties: LeaseParty[];
  /** Callback when party is added successfully */
  onSuccess: () => void;
}

type DialogMode = 'select' | 'create';

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type }: { type: PartyType }) {
  switch (type) {
    case PartyType.Individual:
      return <User className="h-4 w-4" />;
    case PartyType.Company:
      return <Building2 className="h-4 w-4" />;
    case PartyType.Entity:
      return <Briefcase className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
}

// ============================================
// Main Component
// ============================================

export function AddLeasePartyDialog({
  open,
  onOpenChange,
  leaseId,
  leaseStartDate,
  existingParties,
  onSuccess,
}: AddLeasePartyDialogProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Mode: select existing or create new
  const [mode, setMode] = useState<DialogMode>('select');

  // Party search state
  const [searchTerm, setSearchTerm] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // New party form state
  const [newPartyType, setNewPartyType] = useState<PartyType>(PartyType.Individual);
  const [newPartyName, setNewPartyName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  // Party details
  const [role, setRole] = useState<LeasePartyRole>(LeasePartyRole.CoResident);
  const [isPrimary, setIsPrimary] = useState(false);
  const [moveInDate, setMoveInDate] = useState(leaseStartDate);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if lease already has a primary
  const hasExistingPrimary = existingParties.some(p => p.isPrimary);

  // Get IDs of parties already on the lease
  const existingPartyIds = new Set(existingParties.map(p => p.partyId));

  // Search parties with debounce
  const searchParties = useCallback(async (term: string) => {
    if (term.length < 2) {
      setParties([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await listParties({ searchTerm: term, pageSize: 10 });
      // Filter out parties already on the lease
      setParties(result.items.filter(p => !existingPartyIds.has(p.id)));
    } catch (err) {
      console.error('Failed to search parties:', err);
    } finally {
      setIsSearching(false);
    }
  }, [existingPartyIds]);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedParty(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchParties(value);
    }, 300);
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode('select');
      setSearchTerm('');
      setParties([]);
      setSelectedParty(null);
      setNewPartyType(PartyType.Individual);
      setNewPartyName('');
      setNewFirstName('');
      setNewLastName('');
      // Default role based on whether there's already a primary
      setRole(hasExistingPrimary ? LeasePartyRole.CoResident : LeasePartyRole.PrimaryResident);
      setIsPrimary(!hasExistingPrimary);
      setMoveInDate(leaseStartDate);
      setError(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, leaseStartDate, hasExistingPrimary]);

  // Handle form submit
  const handleSubmit = async () => {
    setError(null);

    let partyId: string;

    // Create new party if in create mode
    if (mode === 'create') {
      const name = newPartyType === PartyType.Individual
        ? `${newFirstName} ${newLastName}`.trim()
        : newPartyName.trim();

      if (!name) {
        setError('Please enter a name');
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createParty({
          partyType: newPartyType,
          partyName: name,
          firstName: newPartyType === PartyType.Individual ? newFirstName : undefined,
          lastName: newPartyType === PartyType.Individual ? newLastName : undefined,
          contacts: [],
        });
        partyId = result.id;
      } catch (err: unknown) {
        console.error('Failed to create party:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to create party');
        }
        setIsSubmitting(false);
        return;
      }
    } else {
      // Use selected party
      if (!selectedParty) {
        setError('Please select a party');
        return;
      }
      partyId = selectedParty.id;
      setIsSubmitting(true);
    }

    try {
      await addLeaseParty(leaseId, {
        partyId,
        role,
        isPrimary,
        moveInDate: moveInDate || null,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to add party to lease:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add party to lease');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Party to Lease</DialogTitle>
          <DialogDescription>
            Add a resident, co-resident, or guarantor to this lease
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'select' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('select')}
            >
              <Search className="h-4 w-4" />
              Select Existing
            </Button>
            <Button
              type="button"
              variant={mode === 'create' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('create')}
            >
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>

          {/* Party Selection Mode */}
          {mode === 'select' && (
            <div className="space-y-3">
              {/* Search Input */}
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftAddon={
                  isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )
                }
              />

              {/* Search Results */}
              {parties.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {parties.map((party) => (
                    <button
                      key={party.id}
                      type="button"
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-surface-50 transition-colors ${
                        selectedParty?.id === party.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => setSelectedParty(party)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <PartyTypeIcon type={party.partyType} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {party.partyName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getPartyTypeLabel(party.partyType)}
                        </p>
                      </div>
                      {selectedParty?.id === party.id && (
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Party Display */}
              {selectedParty && (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <PartyTypeIcon type={selectedParty.partyType} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedParty.partyName}</p>
                      <p className="text-sm text-gray-500">
                        {getPartyTypeLabel(selectedParty.partyType)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create New Party Mode */}
          {mode === 'create' && (
            <div className="space-y-4">
              {/* Party Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type
                </label>
                <Select
                  value={newPartyType.toString()}
                  onValueChange={(v) => setNewPartyType(v as PartyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Individual</SelectItem>
                    <SelectItem value="1">Company</SelectItem>
                    <SelectItem value="2">Entity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              {newPartyType === PartyType.Individual ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      First Name *
                    </label>
                    <Input
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Last Name *
                    </label>
                    <Input
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name *
                  </label>
                  <Input
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Party Role & Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Party Details</h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role
                </label>
                <Select
                  value={role.toString()}
                  onValueChange={(v) => setRole(parseInt(v) as LeasePartyRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Primary Resident</SelectItem>
                    <SelectItem value="1">Co-Resident</SelectItem>
                    <SelectItem value="2">Guarantor</SelectItem>
                    <SelectItem value="3">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Move-In Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Move-In Date
                </label>
                <Input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
            </div>

            {/* Primary Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Set as primary party for this lease
              </span>
            </label>
            {hasExistingPrimary && isPrimary && (
              <p className="text-xs text-amber-600">
                Note: This will make this party the new primary.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (mode === 'select' && !selectedParty)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Party'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


