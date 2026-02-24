'use client';

/**
 * Campaign Form Dialog
 * Create or edit an advertising campaign
 * Supports: Banner and Story campaign types, target tenant selection, dates, and caps
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  Megaphone,
  Calendar,
  Target,
  Settings,
  Save,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { listAdvertisers, createCampaign, updateCampaign, getCampaignById } from '@/lib/api/ads';
import { listTenants } from '@/lib/api/tenants';
import { TenantSummary, TenantStatus } from '@/types/tenant';
import {
  Advertiser,
  Campaign,
  CampaignType,
  getCampaignTypeLabel,
} from '@/types/ads';

// ============================================
// Props
// ============================================

interface CampaignFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Edit mode - pass campaign ID to edit
  campaignId?: string | null;
  // Pre-selected advertiser (for creating from advertiser detail page)
  preselectedAdvertiserId?: string | null;
}

// ============================================
// Component
// ============================================

export function CampaignFormDialog({
  open,
  onClose,
  onSuccess,
  campaignId,
  preselectedAdvertiserId,
}: CampaignFormDialogProps) {
  const isEditMode = !!campaignId;

  // Refs for Strict Mode guard
  const advertisersFetchedRef = useRef(false);
  const tenantsFetchedRef = useRef(false);
  const campaignFetchedRef = useRef(false);

  // Data state
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state - Basic
  const [advertiserId, setAdvertiserId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CampaignType>(CampaignType.Banner);

  // Form state - Schedule
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  // Form state - Targeting
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);

  // Form state - Limits
  const [priority, setPriority] = useState(0);
  const [maxImpressions, setMaxImpressions] = useState<string>('');
  const [maxClicks, setMaxClicks] = useState<string>('');
  const [dailyImpressionCap, setDailyImpressionCap] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // ============================================
  // Load Data
  // ============================================

  const loadAdvertisers = useCallback(async (force = false) => {
    if (!force && advertisersFetchedRef.current) return;
    advertisersFetchedRef.current = true;

    try {
      const result = await listAdvertisers({ pageSize: 100 });
      setAdvertisers(result.items);
    } catch (err) {
      console.error('Failed to load advertisers:', err);
      advertisersFetchedRef.current = false;
    }
  }, []);

  const loadTenants = useCallback(async (force = false) => {
    if (!force && tenantsFetchedRef.current) return;
    tenantsFetchedRef.current = true;

    try {
      // Only load active tenants for targeting
      const result = await listTenants({ pageSize: 100, status: TenantStatus.Active });
      setTenants(result.items);
    } catch (err) {
      console.error('Failed to load tenants:', err);
      tenantsFetchedRef.current = false;
    }
  }, []);

  const loadCampaign = useCallback(async () => {
    if (!campaignId) return;
    if (campaignFetchedRef.current) return;
    campaignFetchedRef.current = true;

    try {
      const campaign = await getCampaignById(campaignId);

      // Populate form fields
      setAdvertiserId(campaign.advertiserId);
      setName(campaign.name);
      setType(campaign.type);
      setStartsAt(campaign.startsAt.slice(0, 16)); // Format for datetime-local
      setEndsAt(campaign.endsAt ? campaign.endsAt.slice(0, 16) : '');
      setSelectedTenantIds(campaign.targetTenantIds);
      setPriority(campaign.priority);
      setMaxImpressions(campaign.maxImpressions?.toString() || '');
      setMaxClicks(campaign.maxClicks?.toString() || '');
      setDailyImpressionCap(campaign.dailyImpressionCap?.toString() || '');
      setNotes(campaign.notes || '');
    } catch (err) {
      console.error('Failed to load campaign:', err);
      setError('Failed to load campaign details');
      campaignFetchedRef.current = false;
    }
  }, [campaignId]);

  // Initial load
  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      const promises = [loadAdvertisers(), loadTenants()];
      if (isEditMode) {
        promises.push(loadCampaign());
      }
      Promise.all(promises).finally(() => {
        setIsLoadingData(false);
        // Set preselected advertiser after loading
        if (!isEditMode && preselectedAdvertiserId) {
          setAdvertiserId(preselectedAdvertiserId);
        }
      });
    }
  }, [open, isEditMode, loadAdvertisers, loadTenants, loadCampaign, preselectedAdvertiserId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
      advertisersFetchedRef.current = false;
      tenantsFetchedRef.current = false;
      campaignFetchedRef.current = false;
    }
  }, [open]);

  const resetForm = () => {
    setAdvertiserId('');
    setName('');
    setType(CampaignType.Banner);
    setStartsAt('');
    setEndsAt('');
    setSelectedTenantIds([]);
    setPriority(0);
    setMaxImpressions('');
    setMaxClicks('');
    setDailyImpressionCap('');
    setNotes('');
    setError(null);
    setActiveTab('basic');
  };

  // ============================================
  // Form Handlers
  // ============================================

  const handleSubmit = async () => {
    // Validation
    if (!advertiserId) {
      setError('Please select an advertiser');
      setActiveTab('basic');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a campaign name');
      setActiveTab('basic');
      return;
    }
    if (!startsAt) {
      setError('Please enter a start date');
      setActiveTab('schedule');
      return;
    }
    if (selectedTenantIds.length === 0) {
      setError('Please select at least one target community');
      setActiveTab('targeting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && campaignId) {
        // Update existing campaign
        await updateCampaign(campaignId, {
          name: name.trim(),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          maxImpressions: maxImpressions ? parseInt(maxImpressions) : null,
          maxClicks: maxClicks ? parseInt(maxClicks) : null,
          dailyImpressionCap: dailyImpressionCap ? parseInt(dailyImpressionCap) : null,
          priority,
          notes: notes.trim() || null,
          targetTenantIds: selectedTenantIds,
        });
      } else {
        // Create new campaign
        await createCampaign({
          advertiserId,
          name: name.trim(),
          type,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          maxImpressions: maxImpressions ? parseInt(maxImpressions) : null,
          maxClicks: maxClicks ? parseInt(maxClicks) : null,
          dailyImpressionCap: dailyImpressionCap ? parseInt(dailyImpressionCap) : null,
          priority,
          notes: notes.trim() || null,
          targetTenantIds: selectedTenantIds,
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle tenant selection
  const toggleTenant = (tenantId: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  // Select/Deselect all tenants
  const selectAllTenants = () => {
    setSelectedTenantIds(tenants.map((t) => t.id));
  };

  const deselectAllTenants = () => {
    setSelectedTenantIds([]);
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary-500" />
            {isEditMode ? 'Edit Campaign' : 'New Campaign'}
          </DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="basic">
                <Megaphone className="h-4 w-4 mr-1" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="targeting">
                <Target className="h-4 w-4 mr-1" />
                Targeting
              </TabsTrigger>
              <TabsTrigger value="limits">
                <Settings className="h-4 w-4 mr-1" />
                Limits
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Advertiser */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advertiser *
                </label>
                <Select
                  value={advertiserId}
                  onValueChange={setAdvertiserId}
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select advertiser..." />
                  </SelectTrigger>
                  <SelectContent>
                    {advertisers.map((adv) => (
                      <SelectItem key={adv.id} value={adv.id}>
                        {adv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Advertiser cannot be changed after creation
                  </p>
                )}
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monsoon Laundry Offer"
                  maxLength={200}
                />
              </div>

              {/* Campaign Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type *
                </label>
                <Select
                  value={type.toString()}
                  onValueChange={(v) => setType(parseInt(v) as CampaignType)}
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CampaignType.Banner.toString()}>
                      {getCampaignTypeLabel(CampaignType.Banner)} - Standard banner placements
                    </SelectItem>
                    <SelectItem value={CampaignType.Story.toString()}>
                      {getCampaignTypeLabel(CampaignType.Story)} - Instagram/WhatsApp style stories
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Campaign type cannot be changed after creation
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Internal)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this campaign..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Set the campaign start and end dates
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date/Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date/Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for no end date
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Targeting Tab */}
            <TabsContent value="targeting" className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Target Communities *
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllTenants}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllTenants}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {tenants.length === 0 ? (
                  <p className="col-span-2 text-center text-gray-500 py-4">
                    No active communities available
                  </p>
                ) : (
                  tenants.map((tenant) => (
                    <label
                      key={tenant.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                        selectedTenantIds.includes(tenant.id)
                          ? 'bg-primary-50 border border-primary-200'
                          : 'border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTenantIds.includes(tenant.id)}
                        onChange={() => toggleTenant(tenant.id)}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {tenant.city || tenant.code || 'No location'}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500">
                {selectedTenantIds.length} of {tenants.length} communities selected
              </p>
            </TabsContent>

            {/* Limits Tab */}
            <TabsContent value="limits" className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Configure priority and impression/click caps (optional)
              </p>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher priority campaigns are served first (0-100)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Max Impressions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Impressions
                  </label>
                  <Input
                    type="number"
                    value={maxImpressions}
                    onChange={(e) => setMaxImpressions(e.target.value)}
                    placeholder="No limit"
                    min={0}
                  />
                </div>

                {/* Max Clicks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Clicks
                  </label>
                  <Input
                    type="number"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    placeholder="No limit"
                    min={0}
                  />
                </div>

                {/* Daily Impression Cap */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Imp. Cap
                  </label>
                  <Input
                    type="number"
                    value={dailyImpressionCap}
                    onChange={(e) => setDailyImpressionCap(e.target.value)}
                    placeholder="No limit"
                    min={0}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Leave empty for no limits. Campaign will stop serving once limits are reached.
              </p>
            </TabsContent>
          </Tabs>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingData}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-1" />
            {isEditMode ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

