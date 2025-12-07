'use client';

/**
 * Announcement Form Dialog
 * Create or edit an announcement with full configuration
 * Supports: Basic info, audience targeting, behaviour flags, event settings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  Megaphone,
  Users,
  Calendar,
  Settings,
  AlertTriangle,
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
import { listBlocks, listUnits } from '@/lib/api/community';
import { createAnnouncement, updateAnnouncement, getAnnouncementById } from '@/lib/api/announcements';
import { Block, Unit } from '@/types/community';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AudienceTargetType,
  CreateAnnouncementAudienceInput,
  ANNOUNCEMENT_CATEGORY_OPTIONS,
  ANNOUNCEMENT_PRIORITY_OPTIONS,
} from '@/types/announcement';

// ============================================
// Props
// ============================================

interface AnnouncementFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Edit mode - pass announcement ID to edit
  announcementId?: string | null;
}

// ============================================
// Component
// ============================================

export function AnnouncementFormDialog({
  open,
  onClose,
  onSuccess,
  announcementId,
}: AnnouncementFormDialogProps) {
  const isEditMode = !!announcementId;

  // Refs for Strict Mode guard
  const blocksFetchedRef = useRef(false);
  const unitsFetchedRef = useRef(false);
  const announcementFetchedRef = useRef(false);

  // Data state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [existingAnnouncement, setExistingAnnouncement] = useState<Announcement | null>(null);

  // Form state - Basic
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>(AnnouncementCategory.General);
  const [priority, setPriority] = useState<AnnouncementPriority>(AnnouncementPriority.Normal);

  // Form state - Display
  const [isPinned, setIsPinned] = useState(false);
  const [isBanner, setIsBanner] = useState(false);

  // Form state - Behaviour
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowAddToCalendar, setAllowAddToCalendar] = useState(false);

  // Form state - Event
  const [isEvent, setIsEvent] = useState(false);
  const [eventStartAt, setEventStartAt] = useState('');
  const [eventEndAt, setEventEndAt] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventLocationText, setEventLocationText] = useState('');
  const [eventJoinUrl, setEventJoinUrl] = useState('');

  // Form state - Audience
  const [audienceType, setAudienceType] = useState<AudienceTargetType>(AudienceTargetType.Community);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // ============================================
  // Load Data
  // ============================================

  const loadBlocks = useCallback(async (force = false) => {
    if (!force && blocksFetchedRef.current) return;
    blocksFetchedRef.current = true;

    try {
      const result = await listBlocks({ pageSize: 100 });
      setBlocks(result.items);
    } catch (err) {
      console.error('Failed to load blocks:', err);
      blocksFetchedRef.current = false;
    }
  }, []);

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

  const loadAnnouncement = useCallback(async () => {
    if (!announcementId) return;
    if (announcementFetchedRef.current) return;
    announcementFetchedRef.current = true;

    try {
      const announcement = await getAnnouncementById(announcementId);
      setExistingAnnouncement(announcement);

      // Populate form fields
      setTitle(announcement.title);
      setBody(announcement.body);
      setCategory(announcement.category as AnnouncementCategory);
      setPriority(announcement.priority as AnnouncementPriority);
      setIsPinned(announcement.isPinned);
      setIsBanner(announcement.isBanner);
      setAllowLikes(announcement.allowLikes);
      setAllowComments(announcement.allowComments);
      setAllowAddToCalendar(announcement.allowAddToCalendar);
      setIsEvent(announcement.isEvent);
      setEventStartAt(announcement.eventStartAt ? announcement.eventStartAt.slice(0, 16) : '');
      setEventEndAt(announcement.eventEndAt ? announcement.eventEndAt.slice(0, 16) : '');
      setIsAllDay(announcement.isAllDay);
      setEventLocationText(announcement.eventLocationText || '');
      setEventJoinUrl(announcement.eventJoinUrl || '');

      // Parse audiences
      if (announcement.audiences.length > 0) {
        const firstAudience = announcement.audiences[0];
        setAudienceType(firstAudience.targetType as AudienceTargetType);
        
        if (firstAudience.targetType === AudienceTargetType.Block) {
          setSelectedBlockIds(
            announcement.audiences
              .filter(a => a.blockId)
              .map(a => a.blockId as string)
          );
        } else if (firstAudience.targetType === AudienceTargetType.Unit) {
          setSelectedUnitIds(
            announcement.audiences
              .filter(a => a.unitId)
              .map(a => a.unitId as string)
          );
        }
      }
    } catch (err) {
      console.error('Failed to load announcement:', err);
      setError('Failed to load announcement details');
      announcementFetchedRef.current = false;
    }
  }, [announcementId]);

  // Initial load
  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      const promises = [loadBlocks(), loadUnits()];
      if (isEditMode) {
        promises.push(loadAnnouncement());
      }
      Promise.all(promises).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [open, isEditMode, loadBlocks, loadUnits, loadAnnouncement]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
      blocksFetchedRef.current = false;
      unitsFetchedRef.current = false;
      announcementFetchedRef.current = false;
    }
  }, [open]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setCategory(AnnouncementCategory.General);
    setPriority(AnnouncementPriority.Normal);
    setIsPinned(false);
    setIsBanner(false);
    setAllowLikes(true);
    setAllowComments(true);
    setAllowAddToCalendar(false);
    setIsEvent(false);
    setEventStartAt('');
    setEventEndAt('');
    setIsAllDay(false);
    setEventLocationText('');
    setEventJoinUrl('');
    setAudienceType(AudienceTargetType.Community);
    setSelectedBlockIds([]);
    setSelectedUnitIds([]);
    setError(null);
    setActiveTab('basic');
    setExistingAnnouncement(null);
  };

  // ============================================
  // Form Handlers
  // ============================================

  const buildAudiences = (): CreateAnnouncementAudienceInput[] => {
    switch (audienceType) {
      case AudienceTargetType.Community:
        return [{ targetType: AudienceTargetType.Community }];
      case AudienceTargetType.Block:
        return selectedBlockIds.map(blockId => ({
          targetType: AudienceTargetType.Block,
          blockId,
        }));
      case AudienceTargetType.Unit:
        return selectedUnitIds.map(unitId => ({
          targetType: AudienceTargetType.Unit,
          unitId,
        }));
      default:
        return [{ targetType: AudienceTargetType.Community }];
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Please enter a title');
      setActiveTab('basic');
      return;
    }
    if (!body.trim()) {
      setError('Please enter announcement content');
      setActiveTab('basic');
      return;
    }
    if (audienceType === AudienceTargetType.Block && selectedBlockIds.length === 0) {
      setError('Please select at least one block');
      setActiveTab('audience');
      return;
    }
    if (audienceType === AudienceTargetType.Unit && selectedUnitIds.length === 0) {
      setError('Please select at least one unit');
      setActiveTab('audience');
      return;
    }
    if (isEvent && !eventStartAt) {
      setError('Please enter event start date/time');
      setActiveTab('event');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const audiences = buildAudiences();

      if (isEditMode && announcementId) {
        // Update existing announcement
        await updateAnnouncement(announcementId, {
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          isPinned,
          isBanner,
          allowLikes,
          allowComments,
          allowAddToCalendar,
          isEvent,
          eventStartAt: isEvent && eventStartAt ? new Date(eventStartAt).toISOString() : null,
          eventEndAt: isEvent && eventEndAt ? new Date(eventEndAt).toISOString() : null,
          isAllDay,
          eventLocationText: eventLocationText.trim() || null,
          eventJoinUrl: eventJoinUrl.trim() || null,
          audiences,
        });
      } else {
        // Create new announcement (as draft)
        await createAnnouncement({
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          isPinned,
          isBanner,
          allowLikes,
          allowComments,
          allowAddToCalendar,
          isEvent,
          eventStartAt: isEvent && eventStartAt ? new Date(eventStartAt).toISOString() : null,
          eventEndAt: isEvent && eventEndAt ? new Date(eventEndAt).toISOString() : null,
          isAllDay,
          eventLocationText: eventLocationText.trim() || null,
          eventJoinUrl: eventJoinUrl.trim() || null,
          audiences,
          publishImmediately: false, // Always create as draft
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle block selection
  const toggleBlock = (blockId: string) => {
    setSelectedBlockIds(prev =>
      prev.includes(blockId)
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  // Toggle unit selection
  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
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
            {isEditMode ? 'Edit Announcement' : 'New Announcement'}
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
              <TabsTrigger value="audience">
                <Users className="h-4 w-4 mr-1" />
                Audience
              </TabsTrigger>
              <TabsTrigger value="event">
                <Calendar className="h-4 w-4 mr-1" />
                Event
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Water Supply Maintenance Notice"
                  maxLength={200}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your announcement content here..."
                  rows={6}
                  maxLength={10000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">{body.length}/10000</p>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Select value={category} onValueChange={(v) => setCategory(v as AnnouncementCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Priority
                  </label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as AnnouncementPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who should see this announcement?
                </label>
                <div className="space-y-2">
                  {/* Community - All */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="audienceType"
                      checked={audienceType === AudienceTargetType.Community}
                      onChange={() => setAudienceType(AudienceTargetType.Community)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Entire Community</p>
                      <p className="text-sm text-gray-500">All residents and owners</p>
                    </div>
                  </label>

                  {/* Block */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="audienceType"
                      checked={audienceType === AudienceTargetType.Block}
                      onChange={() => setAudienceType(AudienceTargetType.Block)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Specific Block(s)</p>
                      <p className="text-sm text-gray-500">Target one or more blocks</p>
                    </div>
                  </label>

                  {/* Unit */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="audienceType"
                      checked={audienceType === AudienceTargetType.Unit}
                      onChange={() => setAudienceType(AudienceTargetType.Unit)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Specific Unit(s)</p>
                      <p className="text-sm text-gray-500">Target individual units</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Block Selection */}
              {audienceType === AudienceTargetType.Block && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Blocks
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {blocks.map((block) => (
                      <label
                        key={block.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                          selectedBlockIds.includes(block.id) ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBlockIds.includes(block.id)}
                          onChange={() => toggleBlock(block.id)}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <span className="text-sm">{block.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedBlockIds.length} block(s) selected
                  </p>
                </div>
              )}

              {/* Unit Selection */}
              {audienceType === AudienceTargetType.Unit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Units
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {units.map((unit) => (
                      <label
                        key={unit.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 text-sm ${
                          selectedUnitIds.includes(unit.id) ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnitIds.includes(unit.id)}
                          onChange={() => toggleUnit(unit.id)}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <span>{unit.unitNumber}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUnitIds.length} unit(s) selected
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Event Tab */}
            <TabsContent value="event" className="space-y-4">
              {/* Is Event Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEvent}
                  onChange={(e) => setIsEvent(e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">This is an event</p>
                  <p className="text-sm text-gray-500">Add event date, time, and location</p>
                </div>
              </label>

              {isEvent && (
                <>
                  {/* All Day Toggle */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">All day event</span>
                  </label>

                  {/* Date/Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date/Time *
                      </label>
                      <Input
                        type={isAllDay ? 'date' : 'datetime-local'}
                        value={eventStartAt}
                        onChange={(e) => setEventStartAt(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date/Time
                      </label>
                      <Input
                        type={isAllDay ? 'date' : 'datetime-local'}
                        value={eventEndAt}
                        onChange={(e) => setEventEndAt(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <Input
                      value={eventLocationText}
                      onChange={(e) => setEventLocationText(e.target.value)}
                      placeholder="e.g., Community Hall, Block A Lobby"
                    />
                  </div>

                  {/* Join URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Virtual Meeting Link (optional)
                    </label>
                    <Input
                      type="url"
                      value={eventJoinUrl}
                      onChange={(e) => setEventJoinUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Configure display and engagement options
              </p>

              {/* Display Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Display</h4>
                
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Pin to top</p>
                    <p className="text-sm text-gray-500">Keep this announcement at the top of the list</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBanner}
                    onChange={(e) => setIsBanner(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Show as banner</p>
                    <p className="text-sm text-gray-500">Display prominently as a highlighted banner</p>
                  </div>
                </label>
              </div>

              {/* Engagement Options */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Engagement</h4>
                
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowLikes}
                    onChange={(e) => setAllowLikes(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Allow likes</p>
                    <p className="text-sm text-gray-500">Residents can like this announcement</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Allow comments</p>
                    <p className="text-sm text-gray-500">Residents can comment on this announcement</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAddToCalendar}
                    onChange={(e) => setAllowAddToCalendar(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Add to calendar</p>
                    <p className="text-sm text-gray-500">Show "Add to Calendar" button (for events)</p>
                  </div>
                </label>
              </div>
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
            {isEditMode ? 'Update' : 'Save as Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

