'use client';

/**
 * Add Ownership Dialog
 * Used for both "Add first owner" (F-OWN-02) and "Add joint owner" (F-OWN-03) flows
 * Allows selecting an existing party or creating a new one inline
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
import { createOwnership } from '@/lib/api/ownership';
import {
  Party,
  PartyType,
  getPartyTypeLabel,
} from '@/types/party';
import { UnitOwnership, getTodayAsDateOnly } from '@/types/ownership';

// ============================================
// Types
// ============================================

interface AddOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unit ID to add ownership for */
  unitId: string;
  /** Unit number for display */
  unitNumber: string;
  /** Current owners for context (optional) */
  currentOwners?: UnitOwnership[];
  /** Callback when ownership is created successfully */
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

export function AddOwnershipDialog({
  open,
  onOpenChange,
  unitId,
  unitNumber,
  currentOwners = [],
  onSuccess,
}: AddOwnershipDialogProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Dialog mode: select existing party or create new
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
  
  // Ownership details
  const [ownershipShare, setOwnershipShare] = useState('100');
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(true);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate remaining share for joint ownership
  const currentTotalShare = currentOwners
    .filter(o => o.isCurrentlyActive)
    .reduce((sum, o) => sum + o.ownershipShare, 0);
  const remainingShare = 100 - currentTotalShare;
  
  // Has existing primary owner?
  const hasExistingPrimaryOwner = currentOwners.some(
    o => o.isCurrentlyActive && o.isPrimaryOwner
  );

  // Search parties with debounce
  const searchParties = useCallback(async (term: string) => {
    if (term.length < 2) {
      setParties([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const result = await listParties({ searchTerm: term, pageSize: 10 });
      setParties(result.items);
    } catch (err) {
      console.error('Failed to search parties:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedParty(null);
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce search
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
      setOwnershipShare(remainingShare > 0 ? remainingShare.toString() : '100');
      setFromDate(new Date().toISOString().split('T')[0]);
      setIsPrimaryOwner(!hasExistingPrimaryOwner);
      setError(null);
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, remainingShare, hasExistingPrimaryOwner]);

  // Handle form submit
  const handleSubmit = async () => {
    setError(null);
    
    // Validate ownership share
    const share = parseFloat(ownershipShare);
    if (isNaN(share) || share <= 0 || share > 100) {
      setError('Ownership share must be between 0 and 100');
      return;
    }
    
    // Validate total share won't exceed 100%
    if (currentTotalShare + share > 100) {
      setError(`Total ownership would exceed 100%. Maximum available: ${remainingShare}%`);
      return;
    }
    
    // Parse date
    const [year, month, day] = fromDate.split('-').map(Number);
    if (!year || !month || !day) {
      setError('Please select a valid start date');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let partyId: string;
      
      // Create new party if in create mode
      if (mode === 'create') {
        // Validate new party
        const name = newPartyType === PartyType.Individual
          ? `${newFirstName} ${newLastName}`.trim()
          : newPartyName.trim();
          
        if (!name) {
          setError('Please enter a name');
          setIsSubmitting(false);
          return;
        }
        
        // Create the party
        const result = await createParty({
          partyType: newPartyType,
          partyName: name,
          firstName: newPartyType === PartyType.Individual ? newFirstName : undefined,
          lastName: newPartyType === PartyType.Individual ? newLastName : undefined,
        });
        partyId = result.id;
      } else {
        // Use selected party
        if (!selectedParty) {
          setError('Please select an owner');
          setIsSubmitting(false);
          return;
        }
        partyId = selectedParty.id;
      }
      
      // Create the ownership
      await createOwnership({
        unitId,
        partyId,
        ownershipShare: share,
        fromDate: { year, month, day },
        isPrimaryOwner,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to create ownership:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create ownership. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = currentOwners.length > 0 ? 'Add Joint Owner' : 'Add First Owner';
  const dialogDescription = currentOwners.length > 0
    ? `Add another owner to Unit ${unitNumber}`
    : `Add the first owner to Unit ${unitNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
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

          {/* Ownership Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Ownership Details</h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Share */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ownership Share (%)
                </label>
                <Input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={ownershipShare}
                  onChange={(e) => setOwnershipShare(e.target.value)}
                />
                {currentOwners.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {remainingShare}%
                  </p>
                )}
              </div>

              {/* From Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </div>

            {/* Primary Owner Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimaryOwner}
                onChange={(e) => setIsPrimaryOwner(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="flex items-center gap-2 text-sm text-gray-700">
                <Star className="h-4 w-4" />
                Primary Owner
              </span>
            </label>
            {hasExistingPrimaryOwner && isPrimaryOwner && (
              <p className="text-xs text-amber-600">
                Note: This will make this owner the new primary owner.
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
              disabled={isSubmitting || (mode === 'select' && !selectedParty)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Owner'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


