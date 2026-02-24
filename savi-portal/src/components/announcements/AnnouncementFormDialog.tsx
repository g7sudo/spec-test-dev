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
  ImagePlus,
  X,
  Upload,
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
import {
  createAnnouncement,
  updateAnnouncement,
  getAnnouncementById,
  uploadAnnouncementImage,
  generateTempKey,
} from '@/lib/api/announcements';
import { Block, Unit } from '@/types/community';
import { getIdToken } from '@/lib/auth/firebase';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AudienceTargetType,
  AnnouncementImage,
  CreateAnnouncementAudienceInput,
  ANNOUNCEMENT_CATEGORY_OPTIONS,
  ANNOUNCEMENT_PRIORITY_OPTIONS,
} from '@/types/announcement';

// ============================================
// Types for Image Upload
// ============================================

interface PendingImage {
  tempKey: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [existingAnnouncement, setExistingAnnouncement] = useState<Announcement | null>(null);

  // Image upload state
  const [existingImages, setExistingImages] = useState<AnnouncementImage[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

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

      // Load existing images
      if (announcement.images && announcement.images.length > 0) {
        setExistingImages(announcement.images);
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
    // Reset image state
    setExistingImages([]);
    setImagesToRemove([]);
    // Revoke object URLs for pending images
    pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setPendingImages([]);
  };

  // ============================================
  // Image Handlers
  // ============================================

  /**
   * Handle file selection and upload to temp storage
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        continue;
      }

      const tempKey = generateTempKey();
      const previewUrl = URL.createObjectURL(file);

      // Add to pending images with uploading state
      const newPendingImage: PendingImage = {
        tempKey,
        file,
        previewUrl,
        uploading: true,
        uploaded: false,
      };

      setPendingImages(prev => [...prev, newPendingImage]);

      // Upload to temp storage
      try {
        await uploadAnnouncementImage(file, tempKey, getIdToken);
        
        // Mark as uploaded
        setPendingImages(prev =>
          prev.map(img =>
            img.tempKey === tempKey
              ? { ...img, uploading: false, uploaded: true }
              : img
          )
        );
      } catch (err) {
        console.error('Failed to upload image:', err);
        // Mark as failed
        setPendingImages(prev =>
          prev.map(img =>
            img.tempKey === tempKey
              ? { ...img, uploading: false, error: 'Upload failed' }
              : img
          )
        );
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Remove an existing image (mark for deletion)
   */
  const handleRemoveExistingImage = (imageId: string) => {
    setImagesToRemove(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  /**
   * Remove a pending image (not yet saved)
   */
  const handleRemovePendingImage = (tempKey: string) => {
    const image = pendingImages.find(img => img.tempKey === tempKey);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setPendingImages(prev => prev.filter(img => img.tempKey !== tempKey));
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

    // Check if all images are uploaded
    const uploadingImages = pendingImages.filter(img => img.uploading);
    if (uploadingImages.length > 0) {
      setError('Please wait for all images to finish uploading');
      return;
    }

    // Check for failed uploads
    const failedImages = pendingImages.filter(img => img.error);
    if (failedImages.length > 0) {
      setError('Some images failed to upload. Please remove them and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const audiences = buildAudiences();

      // Get temp keys from successfully uploaded pending images
      const tempDocuments = pendingImages
        .filter(img => img.uploaded)
        .map(img => img.tempKey);

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
          tempDocuments: tempDocuments.length > 0 ? tempDocuments : undefined,
          documentsToRemove: imagesToRemove.length > 0 ? imagesToRemove : undefined,
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
          tempDocuments: tempDocuments.length > 0 ? tempDocuments : undefined,
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
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="basic">
                <Megaphone className="h-4 w-4 mr-1" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImagePlus className="h-4 w-4 mr-1" />
                Images
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

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4">
              <p className="text-sm text-gray-500">
                Upload images for your announcement. First image will be used as thumbnail.
              </p>

              {/* Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <p className="text-xs text-gray-400 mt-1">
                  Max 10MB per image. Supports JPG, PNG, GIF.
                </p>
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-3 gap-3">
                {/* Existing Images */}
                {existingImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden border"
                  >
                    <img
                      src={image.url}
                      alt={image.fileName || 'Image'}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {image.sortOrder === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                        Thumbnail
                      </span>
                    )}
                  </div>
                ))}

                {/* Pending Images */}
                {pendingImages.map((image) => (
                  <div
                    key={image.tempKey}
                    className={`relative group rounded-lg overflow-hidden border ${
                      image.error ? 'border-red-300' : ''
                    }`}
                  >
                    <img
                      src={image.previewUrl}
                      alt={image.file.name}
                      className={`w-full h-24 object-cover ${
                        image.uploading ? 'opacity-50' : ''
                      }`}
                    />
                    {image.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {image.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
                        <span className="text-xs text-white bg-red-500 px-2 py-1 rounded">
                          Failed
                        </span>
                      </div>
                    )}
                    {!image.uploading && (
                      <button
                        type="button"
                        onClick={() => handleRemovePendingImage(image.tempKey)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {image.uploaded && existingImages.length === 0 && pendingImages.indexOf(image) === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                        Thumbnail
                      </span>
                    )}
                  </div>
                ))}

                {/* Empty State */}
                {existingImages.length === 0 && pendingImages.length === 0 && (
                  <div
                    className="col-span-3 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Click to upload images
                    </p>
                  </div>
                )}
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
                    <p className="text-sm text-gray-500">Show &quot;Add to Calendar&quot; button (for events)</p>
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

