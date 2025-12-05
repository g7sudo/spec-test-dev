'use client';

/**
 * Create Lease Dialog
 * Used for creating a new lease for a unit (Flow 4, Step 1)
 * Creates lease in Draft status, optionally with initial parties
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
  Star,
  X,
  Calendar,
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
import { createLease } from '@/lib/api/leases';
import { Party, PartyType, getPartyTypeLabel } from '@/types/party';
import { LeasePartyRole, CreateLeasePartyInput, getLeasePartyRoleLabel } from '@/types/lease';

// ============================================
// Types
// ============================================

interface CreateLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unit ID to create lease for */
  unitId: string;
  /** Unit number for display */
  unitNumber: string;
  /** Callback when lease is created successfully */
  onSuccess: (leaseId: string) => void;
}

interface SelectedParty extends Party {
  role: LeasePartyRole;
  isPrimary: boolean;
  moveInDate: string;
}

type DialogStep = 'details' | 'parties';

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

export function CreateLeaseDialog({
  open,
  onOpenChange,
  unitId,
  unitNumber,
  onSuccess,
}: CreateLeaseDialogProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Step state
  const [step, setStep] = useState<DialogStep>('details');

  // Lease details state
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Party search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParties, setSelectedParties] = useState<SelectedParty[]>([]);

  // New party inline creation
  const [showNewParty, setShowNewParty] = useState(false);
  const [newPartyType, setNewPartyType] = useState<PartyType>(PartyType.Individual);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPartyName, setNewPartyName] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search parties with debounce
  const searchParties = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await listParties({ searchTerm: term, pageSize: 10 });
      // Filter out already selected parties
      const selectedIds = new Set(selectedParties.map(p => p.id));
      setSearchResults(result.items.filter(p => !selectedIds.has(p.id)));
    } catch (err) {
      console.error('Failed to search parties:', err);
    } finally {
      setIsSearching(false);
    }
  }, [selectedParties]);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchParties(value);
    }, 300);
  };

  // Add party to selection
  const addParty = (party: Party) => {
    const hasPrimary = selectedParties.some(p => p.isPrimary);
    const selectedParty: SelectedParty = {
      ...party,
      role: hasPrimary ? LeasePartyRole.CoResident : LeasePartyRole.PrimaryResident,
      isPrimary: !hasPrimary,
      moveInDate: startDate,
    };
    setSelectedParties([...selectedParties, selectedParty]);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Remove party from selection
  const removeParty = (partyId: string) => {
    const removed = selectedParties.find(p => p.id === partyId);
    const remaining = selectedParties.filter(p => p.id !== partyId);
    
    // If removed was primary, make first remaining party primary
    if (removed?.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    
    setSelectedParties(remaining);
  };

  // Update party role/primary
  const updateParty = (partyId: string, updates: Partial<SelectedParty>) => {
    setSelectedParties(prev =>
      prev.map(p => {
        if (p.id === partyId) {
          return { ...p, ...updates };
        }
        // If setting isPrimary, unset others
        if (updates.isPrimary) {
          return { ...p, isPrimary: false };
        }
        return p;
      })
    );
  };

  // Create new party inline
  const handleCreateParty = async () => {
    const name = newPartyType === PartyType.Individual
      ? `${newFirstName} ${newLastName}`.trim()
      : newPartyName.trim();

    if (!name) {
      setError('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createParty({
        partyType: newPartyType,
        partyName: name,
        firstName: newPartyType === PartyType.Individual ? newFirstName : undefined,
        lastName: newPartyType === PartyType.Individual ? newLastName : undefined,
      });

      // Add to selected parties
      const hasPrimary = selectedParties.some(p => p.isPrimary);
      const newParty: SelectedParty = {
        id: result.id,
        partyType: newPartyType,
        partyName: name,
        legalName: null,
        firstName: newFirstName || null,
        lastName: newLastName || null,
        dateOfBirth: null,
        registrationNumber: null,
        taxNumber: null,
        notes: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        role: hasPrimary ? LeasePartyRole.CoResident : LeasePartyRole.PrimaryResident,
        isPrimary: !hasPrimary,
        moveInDate: startDate,
      };
      setSelectedParties([...selectedParties, newParty]);

      // Reset form
      setShowNewParty(false);
      setNewPartyType(PartyType.Individual);
      setNewFirstName('');
      setNewLastName('');
      setNewPartyName('');
    } catch (err: unknown) {
      console.error('Failed to create party:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create party');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    setError(null);

    // Validate
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    // Build parties array
    const parties: CreateLeasePartyInput[] = selectedParties.map(p => ({
      partyId: p.id,
      role: p.role,
      isPrimary: p.isPrimary,
      moveInDate: p.moveInDate || null,
    }));

    setIsSubmitting(true);

    try {
      const result = await createLease({
        unitId,
        startDate,
        endDate: endDate || null,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : null,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        notes: notes || null,
        parties: parties.length > 0 ? parties : null,
      });

      onSuccess(result.id);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to create lease:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create lease. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('details');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setMonthlyRent('');
      setDepositAmount('');
      setNotes('');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedParties([]);
      setShowNewParty(false);
      setError(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lease</DialogTitle>
          <DialogDescription>
            Create a lease for Unit {unitNumber}. Add residents after setting lease terms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step Indicator */}
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                step === 'details'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setStep('details')}
            >
              1. Lease Details
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                step === 'parties'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setStep('parties')}
            >
              2. Add Parties
            </button>
          </div>

          {/* Step 1: Lease Details */}
          {step === 'details' && (
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for open-ended</p>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Monthly Rent
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Security Deposit
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  rows={3}
                  placeholder="Additional lease notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Next Button */}
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep('parties')}>
                  Next: Add Parties
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Add Parties */}
          {step === 'parties' && (
            <div className="space-y-4">
              {/* Search or Create Party */}
              {!showNewParty ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search party by name, email..."
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
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNewParty(true)}
                    >
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                      {searchResults.map((party) => (
                        <button
                          key={party.id}
                          type="button"
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-50 transition-colors"
                          onClick={() => addParty(party)}
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
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Inline Create Party Form */
                <div className="p-4 border rounded-lg bg-surface-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Create New Party</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewParty(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Select
                    value={newPartyType.toString()}
                    onValueChange={(v) => setNewPartyType(parseInt(v) as PartyType)}
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

                  {newPartyType === PartyType.Individual ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="First Name"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                      />
                      <Input
                        placeholder="Last Name"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                      />
                    </div>
                  ) : (
                    <Input
                      placeholder="Name"
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                    />
                  )}

                  <Button
                    size="sm"
                    onClick={handleCreateParty}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add Party
                  </Button>
                </div>
              )}

              {/* Selected Parties */}
              {selectedParties.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Lease Parties</h4>
                  <div className="space-y-2">
                    {selectedParties.map((party) => (
                      <div
                        key={party.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <PartyTypeIcon type={party.partyType} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {party.partyName}
                            </p>
                            {party.isPrimary && (
                              <Star className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Select
                              value={party.role.toString()}
                              onValueChange={(v) =>
                                updateParty(party.id, { role: parseInt(v) as LeasePartyRole })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Primary Resident</SelectItem>
                                <SelectItem value="1">Co-Resident</SelectItem>
                                <SelectItem value="2">Guarantor</SelectItem>
                                <SelectItem value="3">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {!party.isPrimary && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => updateParty(party.id, { isPrimary: true })}
                              >
                                Set Primary
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParty(party.id)}
                          className="text-gray-400 hover:text-error"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedParties.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-700">No parties added yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add at least one party to create the lease
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            {step === 'parties' && (
              <Button variant="secondary" onClick={() => setStep('details')}>
                Back
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {step === 'parties' && (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || selectedParties.length === 0}
                  title={selectedParties.length === 0 ? 'Add at least one party to create lease' : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Lease'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


