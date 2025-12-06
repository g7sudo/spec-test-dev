'use client';

/**
 * Admin Booking Form Dialog
 * Allows admin to book an amenity on behalf of a resident
 * Simple single-form layout
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  Building2,
  User,
  Calendar,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listUnits } from '@/lib/api/community';
import { listResidents } from '@/lib/api/residents';
import { getAmenityAvailability, createBooking } from '@/lib/api/amenities';
import { Unit } from '@/types/community';
import { Resident, ResidentStatus } from '@/types/resident';
import {
  Amenity,
  AmenityAvailability,
  TimeSlot,
  AmenityBookingSource,
  formatTime,
} from '@/types/amenity';

// ============================================
// Types
// ============================================

interface AdminBookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity: Amenity;
  onSuccess: () => void;
}

// ============================================
// Main Component
// ============================================

export function AdminBookingFormDialog({
  open,
  onOpenChange,
  amenity,
  onSuccess,
}: AdminBookingFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unit selection
  const [unitSearch, setUnitSearch] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitSearchRef = useRef<ReturnType<typeof setTimeout>>();

  // Resident selection
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  // Date/Time selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availability, setAvailability] = useState<AmenityAvailability | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Booking details
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState<number | ''>('');

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
      setUnitSearch('');
      setUnits([]);
      setSelectedUnit(null);
      setShowUnitDropdown(false);
      setResidents([]);
      setSelectedResident(null);
      setSelectedDate('');
      setAvailability(null);
      setSelectedSlot(null);
      setTitle('');
      setNotes('');
      setNumberOfGuests('');
    }
  }, [open]);

  // Search units with debounce
  const searchUnits = useCallback(async (search: string) => {
    if (!search.trim()) {
      setUnits([]);
      return;
    }

    setIsLoadingUnits(true);
    try {
      const result = await listUnits({ pageSize: 100 });
      const filtered = result.items.filter(
        (u) =>
          u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
          (u.blockName && u.blockName.toLowerCase().includes(search.toLowerCase()))
      );
      setUnits(filtered.slice(0, 10));
      setShowUnitDropdown(true);
    } catch (err) {
      console.error('Failed to search units:', err);
    } finally {
      setIsLoadingUnits(false);
    }
  }, []);

  // Handle unit search input
  const handleUnitSearchChange = (value: string) => {
    setUnitSearch(value);
    setSelectedUnit(null);
    setResidents([]);
    setSelectedResident(null);

    if (unitSearchRef.current) {
      clearTimeout(unitSearchRef.current);
    }

    unitSearchRef.current = setTimeout(() => {
      searchUnits(value);
    }, 300);
  };

  // Select a unit
  const handleSelectUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setUnitSearch(unit.unitNumber);
    setShowUnitDropdown(false);
    setUnits([]);
  };

  // Load residents when unit is selected
  useEffect(() => {
    if (selectedUnit) {
      setIsLoadingResidents(true);
      setResidents([]);
      setSelectedResident(null);

      listResidents({
        unitId: selectedUnit.id,
        status: ResidentStatus.Current,
        pageSize: 50,
      })
        .then((result) => {
          setResidents(result.items);
          // Auto-select if only one resident
          if (result.items.length === 1) {
            setSelectedResident(result.items[0]);
          }
        })
        .catch((err) => {
          console.error('Failed to load residents:', err);
        })
        .finally(() => {
          setIsLoadingResidents(false);
        });
    }
  }, [selectedUnit]);

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate && amenity) {
      setIsLoadingAvailability(true);
      setAvailability(null);
      setSelectedSlot(null);

      getAmenityAvailability(amenity.id, selectedDate)
        .then((data) => {
          setAvailability(data);
        })
        .catch((err) => {
          console.error('Failed to load availability:', err);
        })
        .finally(() => {
          setIsLoadingAvailability(false);
        });
    }
  }, [selectedDate, amenity]);

  // Submit booking
  const handleSubmit = async () => {
    setError(null);

    if (!selectedUnit) {
      setError('Please select a unit');
      return;
    }

    if (!selectedResident) {
      setError('Please select a resident');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure time is in HH:mm format (strip seconds if present)
      const startTime = selectedSlot.startTime.substring(0, 5);
      const endTime = selectedSlot.endTime.substring(0, 5);
      const startAt = `${selectedDate}T${startTime}:00`;
      const endAt = `${selectedDate}T${endTime}:00`;

      await createBooking({
        amenityId: amenity.id,
        unitId: selectedUnit.id,
        bookedForUserId: selectedResident.communityUserId || selectedResident.partyId,
        startAt,
        endAt,
        source: AmenityBookingSource.AdminPortal,
        title: title || null,
        notes: notes || null,
        numberOfGuests: numberOfGuests || null,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get min date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get max date based on amenity's maxDaysInAdvance
  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + (amenity.maxDaysInAdvance || 30));
    return max.toISOString().split('T')[0];
  };

  const availableSlots = availability?.availableSlots.filter((s) => s.isAvailable) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Book for Resident</DialogTitle>
          <DialogDescription>
            Create a booking for {amenity.name}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Unit Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search unit number..."
                value={unitSearch}
                onChange={(e) => handleUnitSearchChange(e.target.value)}
                onFocus={() => units.length > 0 && setShowUnitDropdown(true)}
                className="pl-10"
              />
              {isLoadingUnits && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Unit Dropdown */}
            {showUnitDropdown && units.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {units.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-50 text-sm"
                    onClick={() => handleSelectUnit(unit)}
                  >
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{unit.unitNumber}</span>
                    {unit.blockName && (
                      <span className="text-gray-500">• {unit.blockName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedUnit && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Unit {selectedUnit.unitNumber} selected
              </div>
            )}
          </div>

          {/* Resident Selection */}
          {selectedUnit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resident <span className="text-red-500">*</span>
              </label>
              {isLoadingResidents ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading residents...
                </div>
              ) : residents.length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  No current residents in this unit
                </div>
              ) : residents.length === 1 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{residents[0].residentName}</span>
                  <span className="text-gray-500">({residents[0].roleText})</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {residents.map((resident) => (
                    <button
                      key={resident.leasePartyId}
                      type="button"
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedResident?.leasePartyId === resident.leasePartyId
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedResident(resident)}
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <span className="font-medium text-sm">{resident.residentName}</span>
                        <span className="text-xs text-gray-500 ml-2">({resident.roleText})</span>
                      </div>
                      {selectedResident?.leasePartyId === resident.leasePartyId && (
                        <CheckCircle className="h-4 w-4 text-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
            />
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot <span className="text-red-500">*</span>
              </label>
              {isLoadingAvailability ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading availability...
                </div>
              ) : availability?.isBlackoutDate ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  This date is blacked out
                  {availability.blackoutReason && `: ${availability.blackoutReason}`}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  No available slots for this date
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`p-2 text-xs rounded-lg border transition-colors ${
                        selectedSlot?.startTime === slot.startTime
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white hover:bg-surface-50 border-gray-200'
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
              {selectedSlot && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <Input
              placeholder="e.g., Birthday Party"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Number of Guests */}
          {amenity.maxGuests && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests (Max: {amenity.maxGuests})
              </label>
              <Input
                type="number"
                min={1}
                max={amenity.maxGuests}
                placeholder="Enter number"
                value={numberOfGuests}
                onChange={(e) =>
                  setNumberOfGuests(e.target.value ? Number(e.target.value) : '')
                }

              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Warnings */}
          {amenity.depositRequired && amenity.depositAmount && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Deposit required: ${amenity.depositAmount.toFixed(2)}
            </div>
          )}

          {amenity.requiresApproval && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
              <Clock className="h-4 w-4 flex-shrink-0" />
              This booking will require approval
            </div>
          )}
        </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Create Booking
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
