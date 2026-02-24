'use client';

/**
 * Create Visitor Pass Dialog
 * Form to pre-register a new visitor pass
 * Selects unit, visitor details, expected arrival time
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Home, User, Car, Clock, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { listUnits } from '@/lib/api/community';
import { createVisitorPass } from '@/lib/api/visitors';
import { Unit } from '@/types/community';
import {
  VisitorType,
  CreateVisitorPassResult,
  VISITOR_TYPE_OPTIONS,
} from '@/types/visitor';

// ============================================
// Props
// ============================================

interface CreateVisitorPassDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function CreateVisitorPassDialog({
  open,
  onClose,
  onSuccess,
}: CreateVisitorPassDialogProps) {
  // Refs for Strict Mode guard
  const unitsFetchedRef = useRef(false);

  // Data state
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [unitId, setUnitId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitType, setVisitType] = useState<VisitorType>(VisitorType.Guest);
  const [visitorPhone, setVisitorPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [deliveryProvider, setDeliveryProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedFrom, setExpectedFrom] = useState('');
  const [expectedTo, setExpectedTo] = useState('');
  const [notifyVisitorAtGate, setNotifyVisitorAtGate] = useState(true);

  // Result state (for showing access code after creation)
  const [result, setResult] = useState<CreateVisitorPassResult | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Load Data
  // ============================================

  const loadUnits = useCallback(async (force = false) => {
    if (!force && unitsFetchedRef.current) return;
    unitsFetchedRef.current = true;

    try {
      const result = await listUnits({ pageSize: 500 });
      setUnits(result.items);
    } catch (err) {
      console.error('Failed to load units:', err);
      unitsFetchedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      loadUnits().finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [open, loadUnits]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setUnitId('');
      setVisitorName('');
      setVisitType(VisitorType.Guest);
      setVisitorPhone('');
      setVehicleNumber('');
      setVehicleType('');
      setDeliveryProvider('');
      setNotes('');
      setExpectedFrom('');
      setExpectedTo('');
      setNotifyVisitorAtGate(true);
      setResult(null);
      setError(null);
      unitsFetchedRef.current = false;
    }
  }, [open]);

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    // Validation
    if (!unitId) {
      setError('Please select a unit');
      return;
    }
    if (!visitorName.trim()) {
      setError('Please enter the visitor name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const passResult = await createVisitorPass({
        unitId,
        visitorName: visitorName.trim(),
        visitType,
        visitorPhone: visitorPhone.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        vehicleType: vehicleType.trim() || undefined,
        deliveryProvider: visitType === VisitorType.Delivery ? deliveryProvider.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
        expectedFrom: expectedFrom || undefined,
        expectedTo: expectedTo || undefined,
        notifyVisitorAtGate,
      });

      setResult(passResult);
    } catch (err) {
      console.error('Failed to create visitor pass:', err);
      setError(err instanceof Error ? err.message : 'Failed to create visitor pass');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    onSuccess();
  };

  // ============================================
  // Render - Success State
  // ============================================

  if (result) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDone()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">Pass Created Successfully</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center py-4">
            <p className="text-sm text-gray-600">
              Share this access code with your visitor:
            </p>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                {result.accessCode}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              The visitor can use this code at the gate for entry.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================
  // Render - Form
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pre-Register Visitor</DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unit Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="h-4 w-4 inline mr-1" />
                Unit *
              </label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNumber}
                      {unit.blockName && ` • ${unit.blockName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visitor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Visitor Name *
              </label>
              <Input
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Full name of the visitor"
                maxLength={200}
              />
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visit Type
              </label>
              <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitorType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISITOR_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="Visitor's phone number"
                maxLength={50}
              />
            </div>

            {/* Delivery Provider (conditional) */}
            {visitType === VisitorType.Delivery && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Provider
                </label>
                <Input
                  value={deliveryProvider}
                  onChange={(e) => setDeliveryProvider(e.target.value)}
                  placeholder="e.g., DHL, FedEx, Amazon"
                  maxLength={100}
                />
              </div>
            )}

            {/* Vehicle Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Car className="h-4 w-4 inline mr-1" />
                  Vehicle Number
                </label>
                <Input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Plate number"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <Input
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="e.g., Car, Motorcycle"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Expected Time Window */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Expected From
                </label>
                <Input
                  type="datetime-local"
                  value={expectedFrom}
                  onChange={(e) => setExpectedFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected To
                </label>
                <Input
                  type="datetime-local"
                  value={expectedTo}
                  onChange={(e) => setExpectedTo(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information for the security team..."
                rows={2}
                maxLength={1000}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Notify at Gate */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyVisitorAtGate}
                onChange={(e) => setNotifyVisitorAtGate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Notify when visitor arrives at gate</span>
            </label>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingData}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
