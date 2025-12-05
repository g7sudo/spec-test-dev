'use client';

/**
 * Transfer Ownership Dialog (F-OWN-04)
 * Transfers ownership from current owners to new owners
 * Cleanly ends all current active ownerships and creates new ones
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
  Trash2,
  ArrowRight,
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
import { listParties } from '@/lib/api/parties';
import { transferOwnership } from '@/lib/api/ownership';
import {
  Party,
  PartyType,
  getPartyTypeLabel,
} from '@/types/party';
import {
  UnitOwnership,
  NewOwnerEntry,
  formatDateOnly,
} from '@/types/ownership';

// ============================================
// Types
// ============================================

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unit ID for ownership transfer */
  unitId: string;
  /** Unit number for display */
  unitNumber: string;
  /** Current active owners */
  currentOwners: UnitOwnership[];
  /** Callback when transfer is successful */
  onSuccess: () => void;
}

interface NewOwnerRow {
  id: string;
  party: Party | null;
  ownershipShare: string;
  isPrimaryOwner: boolean;
}

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

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  unitId,
  unitNumber,
  currentOwners,
  onSuccess,
}: TransferOwnershipDialogProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Transfer date
  const [transferDate, setTransferDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // New owners
  const [newOwners, setNewOwners] = useState<NewOwnerRow[]>([]);
  
  // Party search state
  const [searchingRowId, setSearchingRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with one new owner row
  useEffect(() => {
    if (open) {
      setTransferDate(new Date().toISOString().split('T')[0]);
      setNewOwners([{
        id: crypto.randomUUID(),
        party: null,
        ownershipShare: '100',
        isPrimaryOwner: true,
      }]);
      setSearchingRowId(null);
      setSearchTerm('');
      setSearchResults([]);
      setError(null);
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open]);

  // Search parties with debounce
  const searchParties = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const result = await listParties({ searchTerm: term, pageSize: 10 });
      setSearchResults(result.items);
    } catch (err) {
      console.error('Failed to search parties:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input
  const handleSearchChange = (rowId: string, value: string) => {
    setSearchingRowId(rowId);
    setSearchTerm(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchParties(value);
    }, 300);
  };

  // Select party for a row
  const handleSelectParty = (rowId: string, party: Party) => {
    setNewOwners(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, party } : row
      )
    );
    setSearchingRowId(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Update owner row
  const updateOwnerRow = (rowId: string, updates: Partial<NewOwnerRow>) => {
    setNewOwners(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    );
  };

  // Add another owner row
  const addOwnerRow = () => {
    setNewOwners(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        party: null,
        ownershipShare: '',
        isPrimaryOwner: false,
      },
    ]);
  };

  // Remove owner row
  const removeOwnerRow = (rowId: string) => {
    setNewOwners(prev => prev.filter(row => row.id !== rowId));
  };

  // Handle submit
  const handleSubmit = async () => {
    setError(null);
    
    // Validate transfer date
    const [year, month, day] = transferDate.split('-').map(Number);
    if (!year || !month || !day) {
      setError('Please select a valid transfer date');
      return;
    }
    
    // Validate new owners
    const validOwners = newOwners.filter(row => row.party);
    if (validOwners.length === 0) {
      setError('Please add at least one new owner');
      return;
    }
    
    // Validate shares
    let totalShare = 0;
    for (const owner of validOwners) {
      const share = parseFloat(owner.ownershipShare);
      if (isNaN(share) || share <= 0 || share > 100) {
        setError('All ownership shares must be between 0 and 100');
        return;
      }
      totalShare += share;
    }
    
    if (totalShare > 100) {
      setError('Total ownership share cannot exceed 100%');
      return;
    }
    
    // Validate exactly one primary owner
    const primaryCount = validOwners.filter(o => o.isPrimaryOwner).length;
    if (primaryCount !== 1) {
      setError('Exactly one new owner must be marked as primary');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newOwnersData: NewOwnerEntry[] = validOwners.map(owner => ({
        partyId: owner.party!.id,
        ownershipShare: parseFloat(owner.ownershipShare),
        isPrimaryOwner: owner.isPrimaryOwner,
      }));
      
      // API expects ISO date string "YYYY-MM-DD"
      await transferOwnership({
        unitId,
        transferDate: transferDate, // Already in ISO format from input[type=date]
        newOwners: newOwnersData,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to transfer ownership:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to transfer ownership. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            Transfer Unit {unitNumber} to new owner(s). All current ownerships will be ended.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Owners Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Owners</h4>
            <div className="bg-surface-50 rounded-lg p-3 space-y-2">
              {currentOwners.filter(o => o.isCurrentlyActive).map(owner => (
                <div key={owner.id} className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <PartyTypeIcon type={owner.partyType} />
                  </div>
                  <span className="flex-1 font-medium">{owner.partyName}</span>
                  <span className="text-gray-500">{owner.ownershipShare}%</span>
                  {owner.isPrimaryOwner && (
                    <Star className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          {/* Transfer Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Transfer Date
            </label>
            <Input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current ownerships will end the day before this date.
            </p>
          </div>

          {/* New Owners */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">New Owners</h4>
              <Button type="button" variant="secondary" size="sm" onClick={addOwnerRow}>
                <Plus className="h-4 w-4" />
                Add Owner
              </Button>
            </div>

            <div className="space-y-4">
              {newOwners.map((row, index) => (
                <div key={row.id} className="p-4 border rounded-lg space-y-3">
                  {/* Row Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      New Owner {index + 1}
                    </span>
                    {newOwners.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOwnerRow(row.id)}
                        className="text-gray-400 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Party Selection */}
                  {row.party ? (
                    <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        <PartyTypeIcon type={row.party.partyType} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{row.party.partyName}</p>
                        <p className="text-xs text-gray-500">
                          {getPartyTypeLabel(row.party.partyType)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => updateOwnerRow(row.id, { party: null })}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Search by name..."
                        value={searchingRowId === row.id ? searchTerm : ''}
                        onChange={(e) => handleSearchChange(row.id, e.target.value)}
                        onFocus={() => setSearchingRowId(row.id)}
                        leftAddon={
                          isSearching && searchingRowId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )
                        }
                      />
                      
                      {/* Search Results */}
                      {searchingRowId === row.id && searchResults.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                          {searchResults.map((party) => (
                            <button
                              key={party.id}
                              type="button"
                              className="w-full flex items-center gap-3 p-2 text-left hover:bg-surface-50"
                              onClick={() => handleSelectParty(row.id, party)}
                            >
                              <PartyTypeIcon type={party.partyType} />
                              <span className="text-sm">{party.partyName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Share and Primary */}
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Share (%)
                      </label>
                      <Input
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={row.ownershipShare}
                        onChange={(e) =>
                          updateOwnerRow(row.id, { ownershipShare: e.target.value })
                        }
                        placeholder="100"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={row.isPrimaryOwner}
                        onChange={(e) =>
                          updateOwnerRow(row.id, { isPrimaryOwner: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                      />
                      <Star className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Primary</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
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
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || newOwners.every(r => !r.party)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer Ownership'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


