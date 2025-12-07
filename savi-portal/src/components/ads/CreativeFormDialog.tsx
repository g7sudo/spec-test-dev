'use client';

/**
 * Creative Form Dialog
 * Add Banner or Story Slide creative to a campaign
 */

import { useState, useEffect } from 'react';
import { Image, Save, Link, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { addBannerCreative, addStorySlide } from '@/lib/api/ads';
import {
  CampaignType,
  AdPlacement,
  CTAType,
  getAdPlacementLabel,
  getCTATypeLabel,
} from '@/types/ads';

// ============================================
// Props
// ============================================

interface CreativeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignId: string;
  campaignType: CampaignType;
  existingSequences?: number[]; // For story slides, to suggest next sequence
}

// ============================================
// Component
// ============================================

export function CreativeFormDialog({
  open,
  onClose,
  onSuccess,
  campaignId,
  campaignType,
  existingSequences = [],
}: CreativeFormDialogProps) {
  const isBannerType = campaignType === CampaignType.Banner;

  // Form state - Shared
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [ctaType, setCtaType] = useState<CTAType>(CTAType.None);
  const [ctaValue, setCtaValue] = useState('');

  // Form state - Banner specific
  const [placement, setPlacement] = useState<AdPlacement>(AdPlacement.HomeTop);
  const [sizeCode, setSizeCode] = useState('');

  // Form state - Story specific
  const [sequence, setSequence] = useState(1);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setMediaUrl('');
      setCaption('');
      setCtaType(CTAType.None);
      setCtaValue('');
      setPlacement(AdPlacement.HomeTop);
      setSizeCode('');
      // Suggest next sequence number for stories
      if (!isBannerType && existingSequences.length > 0) {
        const maxSeq = Math.max(...existingSequences);
        setSequence(maxSeq + 1);
      } else {
        setSequence(1);
      }
      setError(null);
    }
  }, [open, isBannerType, existingSequences]);

  // ============================================
  // Form Handlers
  // ============================================

  const handleSubmit = async () => {
    // Validation
    if (!mediaUrl.trim()) {
      setError('Please enter a media URL');
      return;
    }

    // Validate URL format
    try {
      new URL(mediaUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    // Validate CTA value if CTA type is set
    if (ctaType !== CTAType.None && !ctaValue.trim()) {
      setError('Please enter a CTA value (phone number, URL, etc.)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isBannerType) {
        await addBannerCreative(campaignId, {
          mediaUrl: mediaUrl.trim(),
          placement,
          sizeCode: sizeCode.trim() || null,
          caption: caption.trim() || null,
          ctaType,
          ctaValue: ctaValue.trim() || null,
        });
      } else {
        await addStorySlide(campaignId, {
          mediaUrl: mediaUrl.trim(),
          sequence,
          caption: caption.trim() || null,
          ctaType,
          ctaValue: ctaValue.trim() || null,
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to add creative:', err);
      setError(err instanceof Error ? err.message : 'Failed to add creative');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get placeholder for CTA value based on type
  const getCtaValuePlaceholder = () => {
    switch (ctaType) {
      case CTAType.Call:
        return '+971 50 000 0000';
      case CTAType.WhatsApp:
        return 'https://wa.me/971500000000';
      case CTAType.Link:
        return 'https://example.com/offer';
      default:
        return '';
    }
  };

  // Get icon for CTA type
  const getCtaIcon = (type: CTAType) => {
    switch (type) {
      case CTAType.Call:
        return <Phone className="h-4 w-4" />;
      case CTAType.WhatsApp:
        return <MessageSquare className="h-4 w-4" />;
      case CTAType.Link:
        return <Link className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary-600" />
          {isBannerType ? 'Add Banner Creative' : 'Add Story Slide'}
        </DialogTitle>

        <div className="mt-4 space-y-5">
          {/* Media URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Media URL *
            </label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://cdn.example.com/ads/banner.png"
              leftAddon={<Image className="h-4 w-4" />}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isBannerType
                ? 'Banner image URL (recommended: 1200x628 for HomeTop, 600x300 for others)'
                : 'Full-screen story image (recommended: 1080x1920) or short video URL'}
            </p>
          </div>

          {/* Banner Specific: Placement */}
          {isBannerType && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placement *
                </label>
                <Select
                  value={placement.toString()}
                  onValueChange={(v) => setPlacement(parseInt(v) as AdPlacement)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[AdPlacement.HomeTop, AdPlacement.HomeMiddle, AdPlacement.HomeBottom].map(
                      (p) => (
                        <SelectItem key={p} value={p.toString()}>
                          {getAdPlacementLabel(p)}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size Code
                </label>
                <Input
                  value={sizeCode}
                  onChange={(e) => setSizeCode(e.target.value)}
                  placeholder="e.g., HOME_LARGE"
                />
              </div>
            </div>
          )}

          {/* Story Specific: Sequence */}
          {!isBannerType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slide Sequence *
              </label>
              <Input
                type="number"
                value={sequence}
                onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
                min={1}
                max={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Order in which this slide appears (1 = first)
              </p>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={isBannerType ? 'Optional banner caption' : 'Text overlay on slide'}
              maxLength={200}
            />
          </div>

          {/* CTA Section */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900">Call-to-Action</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Type
              </label>
              <Select
                value={ctaType.toString()}
                onValueChange={(v) => setCtaType(parseInt(v) as CTAType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CTAType.None.toString()}>
                    {getCTATypeLabel(CTAType.None)} - No action
                  </SelectItem>
                  <SelectItem value={CTAType.Call.toString()}>
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {getCTATypeLabel(CTAType.Call)} - Opens phone dialer
                    </span>
                  </SelectItem>
                  <SelectItem value={CTAType.WhatsApp.toString()}>
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {getCTATypeLabel(CTAType.WhatsApp)} - Opens WhatsApp chat
                    </span>
                  </SelectItem>
                  <SelectItem value={CTAType.Link.toString()}>
                    <span className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      {getCTATypeLabel(CTAType.Link)} - Opens URL/deep link
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ctaType !== CTAType.None && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA Value *
                </label>
                <Input
                  value={ctaValue}
                  onChange={(e) => setCtaValue(e.target.value)}
                  placeholder={getCtaValuePlaceholder()}
                  leftAddon={getCtaIcon(ctaType)}
                />
              </div>
            )}
          </div>

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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-1" />
            Add Creative
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

