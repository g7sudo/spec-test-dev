'use client';

/**
 * Assessment Dialog
 * Submit site visit assessment summary for a maintenance request
 */

import { useState } from 'react';
import { Loader2, ClipboardCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { submitAssessment } from '@/lib/api/maintenance';

// ============================================
// Props
// ============================================

interface AssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  currentAssessment?: string | null;
}

// ============================================
// Component
// ============================================

export function AssessmentDialog({
  open,
  onClose,
  onSuccess,
  requestId,
  currentAssessment,
}: AssessmentDialogProps) {
  // Form state
  const [summary, setSummary] = useState(currentAssessment || '');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useState(() => {
    if (open) {
      setSummary(currentAssessment || '');
      setError(null);
    }
  });

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError('Please enter an assessment summary');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitAssessment(requestId, { assessmentSummary: summary.trim() });
      onSuccess();
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <ClipboardCheck className="h-5 w-5 inline mr-2" />
            Site Assessment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assessment Summary *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe findings from site visit, e.g., 'Tap cartridge worn; needs replacement. No pipe damage.'"
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Summarize the findings from the site visit and what work is needed
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !summary.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

