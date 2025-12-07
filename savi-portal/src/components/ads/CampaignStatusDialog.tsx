'use client';

/**
 * Campaign Status Dialog
 * Update campaign status (Draft, Active, Paused, Ended)
 */

import { useState } from 'react';
import { Play, Pause, StopCircle, FileEdit, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { updateCampaignStatus } from '@/lib/api/ads';
import {
  Campaign,
  CampaignStatus,
  getCampaignStatusLabel,
  getCampaignStatusColor,
} from '@/types/ads';

// ============================================
// Props
// ============================================

interface CampaignStatusDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaign: Campaign | null;
}

// ============================================
// Status Options with metadata
// ============================================

const STATUS_OPTIONS = [
  {
    status: CampaignStatus.Draft,
    label: 'Draft',
    description: 'Campaign is being prepared, not visible to users',
    icon: FileEdit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 hover:bg-gray-200',
  },
  {
    status: CampaignStatus.Active,
    label: 'Active',
    description: 'Campaign is running and visible to target communities',
    icon: Play,
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200',
  },
  {
    status: CampaignStatus.Paused,
    label: 'Paused',
    description: 'Campaign is temporarily stopped, can be resumed',
    icon: Pause,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
  },
  {
    status: CampaignStatus.Ended,
    label: 'Ended',
    description: 'Campaign has ended and cannot be reactivated',
    icon: StopCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200',
  },
];

// ============================================
// Component
// ============================================

export function CampaignStatusDialog({
  open,
  onClose,
  onSuccess,
  campaign,
}: CampaignStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected status when campaign changes
  useState(() => {
    if (campaign) {
      setSelectedStatus(campaign.status);
    }
  });

  if (!campaign) return null;

  const handleSubmit = async () => {
    if (selectedStatus === null || selectedStatus === campaign.status) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateCampaignStatus(campaign.id, { status: selectedStatus });
      onSuccess();
    } catch (err) {
      console.error('Failed to update campaign status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get valid transitions based on current status
  const getValidStatuses = (currentStatus: CampaignStatus): CampaignStatus[] => {
    switch (currentStatus) {
      case CampaignStatus.Draft:
        // From Draft: can go to Active or Ended
        return [CampaignStatus.Draft, CampaignStatus.Active, CampaignStatus.Ended];
      case CampaignStatus.Active:
        // From Active: can go to Paused or Ended
        return [CampaignStatus.Active, CampaignStatus.Paused, CampaignStatus.Ended];
      case CampaignStatus.Paused:
        // From Paused: can go to Active or Ended
        return [CampaignStatus.Paused, CampaignStatus.Active, CampaignStatus.Ended];
      case CampaignStatus.Ended:
        // From Ended: cannot change
        return [CampaignStatus.Ended];
      default:
        return [];
    }
  };

  const validStatuses = getValidStatuses(campaign.status);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Update Campaign Status</DialogTitle>

        <div className="mt-4 space-y-4">
          {/* Current Status */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{campaign.name}</span>
            <span className="mx-2">•</span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCampaignStatusColor(
                campaign.status
              )}`}
            >
              Currently: {getCampaignStatusLabel(campaign.status)}
            </span>
          </div>

          {/* Status Options */}
          <div className="space-y-2">
            {STATUS_OPTIONS.filter((opt) => validStatuses.includes(opt.status)).map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedStatus === opt.status;
              const isCurrent = campaign.status === opt.status;

              return (
                <label
                  key={opt.status}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? `${opt.bgColor} border-${opt.color.replace('text-', '')}`
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.status}
                    checked={isSelected}
                    onChange={() => setSelectedStatus(opt.status)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${opt.color}`} />
                      <span className="font-medium text-gray-900">{opt.label}</span>
                      {isCurrent && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Warning for Ended */}
          {selectedStatus === CampaignStatus.Ended &&
            campaign.status !== CampaignStatus.Ended && (
              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                <strong>Warning:</strong> Ending a campaign is permanent. You will not be able to
                reactivate it after this action.
              </div>
            )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              selectedStatus === null ||
              selectedStatus === campaign.status
            }
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

