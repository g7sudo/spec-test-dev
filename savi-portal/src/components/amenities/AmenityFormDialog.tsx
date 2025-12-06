'use client';

/**
 * Amenity Form Dialog
 * Used for creating and editing amenities
 * Multi-step form: Basic Details → Booking Rules → Deposit Settings → Images
 */

import { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Star,
  Image as ImageIcon,
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
import {
  createAmenity,
  updateAmenity,
  generateTempKey,
  uploadAmenityImage,
} from '@/lib/api/amenities';
import { getIdToken } from '@/lib/auth/firebase';
import {
  Amenity,
  AmenityType,
  AmenityStatus,
  DocumentDto,
  DocumentActionState,
  DocumentManagementDto,
  AMENITY_TYPE_OPTIONS,
  AMENITY_STATUS_OPTIONS,
} from '@/types/amenity';

// ============================================
// Constants
// ============================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;

// ============================================
// Types
// ============================================

interface AmenityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing amenity for editing; null for create mode */
  amenity?: Amenity | null;
  /** Callback when amenity is created/updated successfully */
  onSuccess: () => void;
}

type FormStep = 'basic' | 'booking' | 'deposit' | 'images';

interface FormData {
  // Basic details
  name: string;
  code: string;
  type: AmenityType;
  status: AmenityStatus;
  description: string;
  locationText: string;
  isVisibleInApp: boolean;
  displayOrder: number;
  // Booking rules
  isBookable: boolean;
  requiresApproval: boolean;
  slotDurationMinutes: number;
  openTime: string;
  closeTime: string;
  cleanupBufferMinutes: number;
  maxDaysInAdvance: number;
  maxActiveBookingsPerUnit: number | null;
  maxGuests: number | null;
  // Deposit settings
  depositRequired: boolean;
  depositAmount: number | null;
}

/** Represents an image in the gallery (existing or new) */
interface GalleryImage {
  id: string; // Document ID for existing, tempKey for new
  url: string; // downloadUrl for existing, blob URL for new
  fileName: string;
  isNew: boolean; // true if uploaded in this session
  isPrimary: boolean; // displayOrder === 0
  markedForDeletion: boolean;
}

// ============================================
// Default form data
// ============================================

const defaultFormData: FormData = {
  name: '',
  code: '',
  type: AmenityType.PartyHall,
  status: AmenityStatus.Active,
  description: '',
  locationText: '',
  isVisibleInApp: true,
  displayOrder: 0,
  isBookable: true,
  requiresApproval: true,
  slotDurationMinutes: 60,
  openTime: '09:00',
  closeTime: '22:00',
  cleanupBufferMinutes: 15,
  maxDaysInAdvance: 30,
  maxActiveBookingsPerUnit: 2,
  maxGuests: 50,
  depositRequired: false,
  depositAmount: null,
};

// ============================================
// Main Component
// ============================================

export function AmenityFormDialog({
  open,
  onOpenChange,
  amenity,
  onSuccess,
}: AmenityFormDialogProps) {
  const isEdit = !!amenity;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [step, setStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image gallery state
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Handler to trigger file input
  const handleAddImagesClick = () => {
    fileInputRef.current?.click();
  };

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setStep('basic');
      setError(null);
      setUploadProgress(null);

      if (amenity) {
        setFormData({
          name: amenity.name,
          code: amenity.code || '',
          type: amenity.type as AmenityType,
          status: amenity.status as AmenityStatus,
          description: amenity.description || '',
          locationText: amenity.locationText || '',
          isVisibleInApp: amenity.isVisibleInApp,
          displayOrder: amenity.displayOrder,
          isBookable: amenity.isBookable,
          requiresApproval: amenity.requiresApproval,
          slotDurationMinutes: amenity.slotDurationMinutes,
          openTime: amenity.openTime || '09:00',
          closeTime: amenity.closeTime || '22:00',
          cleanupBufferMinutes: amenity.cleanupBufferMinutes,
          maxDaysInAdvance: amenity.maxDaysInAdvance,
          maxActiveBookingsPerUnit: amenity.maxActiveBookingsPerUnit,
          maxGuests: amenity.maxGuests,
          depositRequired: amenity.depositRequired,
          depositAmount: amenity.depositAmount,
        });

        // Load existing images
        const existingImages: GalleryImage[] = (amenity.documents || [])
          .filter((doc) => doc.actionState !== DocumentActionState.Deleted)
          .map((doc) => ({
            id: doc.id,
            url: doc.downloadUrl,
            fileName: doc.fileName,
            isNew: false,
            isPrimary: doc.displayOrder === 0,
            markedForDeletion: false,
          }));
        setImages(existingImages);
      } else {
        setFormData(defaultFormData);
        setImages([]);
      }
    }

    // Cleanup blob URLs on close
    return () => {
      images.forEach((img) => {
        if (img.isNew && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [open, amenity]);

  // Update a single form field
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Validate current step
  const validateStep = (): boolean => {
    setError(null);

    if (step === 'basic') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
    }

    if (step === 'booking') {
      if (formData.isBookable) {
        if (!formData.openTime || !formData.closeTime) {
          setError('Open and close times are required for bookable amenities');
          return false;
        }

        if (formData.slotDurationMinutes < 15) {
          setError('Slot duration must be at least 15 minutes');
          return false;
        }
      }
    }

    if (step === 'deposit') {
      if (formData.depositRequired && (!formData.depositAmount || formData.depositAmount <= 0)) {
        setError('Deposit amount is required when deposit is enabled');
        return false;
      }
    }

    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return;

    if (step === 'basic') {
      setStep('booking');
    } else if (step === 'booking') {
      setStep('deposit');
    } else if (step === 'deposit') {
      setStep('images');
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (step === 'booking') {
      setStep('basic');
    } else if (step === 'deposit') {
      setStep('booking');
    } else if (step === 'images') {
      setStep('deposit');
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    // IMPORTANT: Copy FileList to array BEFORE resetting input
    // FileList is a live reference that gets cleared when input is reset
    const files = Array.from(fileList);

    // Reset input AFTER copying files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Check max images
    const activeImages = images.filter((img) => !img.markedForDeletion);
    if (activeImages.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const newImages: GalleryImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        // Validate file type
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Use JPEG, PNG, GIF, or WebP.`);
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`File too large: ${file.name}. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        }

        // Generate temp key and upload
        const tempKey = generateTempKey();
        await uploadAmenityImage(file, tempKey, getIdToken);

        // Create local preview
        const objectUrl = URL.createObjectURL(file);

        newImages.push({
          id: tempKey,
          url: objectUrl,
          fileName: file.name,
          isNew: true,
          isPrimary: activeImages.length === 0 && i === 0,
          markedForDeletion: false,
        });
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Remove image
  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => {
      const updated = prev.map((img) => {
        if (img.id === imageId) {
          // If it's a new image, remove it completely; otherwise mark for deletion
          if (img.isNew) {
            if (img.url.startsWith('blob:')) {
              URL.revokeObjectURL(img.url);
            }

            return null; // Will be filtered out
          }

          return { ...img, markedForDeletion: true };
        }

        return img;
      }).filter(Boolean) as GalleryImage[];

      // If we removed the primary, make the first active one primary
      const activeImages = updated.filter((img) => !img.markedForDeletion);
      const hasPrimary = activeImages.some((img) => img.isPrimary);
      if (!hasPrimary && activeImages.length > 0) {
        activeImages[0].isPrimary = true;
      }

      return updated;
    });
  };

  // Set primary image
  const handleSetPrimary = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId && !img.markedForDeletion,
      }))
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build base payload
      const basePayload = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        type: formData.type,
        status: formData.status,
        description: formData.description.trim() || null,
        locationText: formData.locationText.trim() || null,
        isVisibleInApp: formData.isVisibleInApp,
        displayOrder: formData.displayOrder,
        isBookable: formData.isBookable,
        requiresApproval: formData.requiresApproval,
        slotDurationMinutes: formData.slotDurationMinutes,
        openTime: formData.openTime || null,
        closeTime: formData.closeTime || null,
        cleanupBufferMinutes: formData.cleanupBufferMinutes,
        maxDaysInAdvance: formData.maxDaysInAdvance,
        maxActiveBookingsPerUnit: formData.maxActiveBookingsPerUnit,
        maxGuests: formData.maxGuests,
        depositRequired: formData.depositRequired,
        depositAmount: formData.depositRequired ? formData.depositAmount : null,
      };

      // Collect new temp document keys
      const newImages = images.filter((img) => img.isNew && !img.markedForDeletion);
      const tempDocuments = newImages.length > 0 ? newImages.map((img) => img.id) : null;

      if (isEdit && amenity) {
        // For update: build documents management array
        const documents: DocumentManagementDto[] = [];

        // Get active images (not new, not marked for deletion) with their new display order
        const activeExistingImages = images
          .filter((img) => !img.isNew && !img.markedForDeletion)
          .sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : 0));

        activeExistingImages.forEach((img, index) => {
          documents.push({
            id: img.id,
            displayOrder: img.isPrimary ? 0 : index + 1,
          });
        });

        // Mark deleted images
        const deletedImages = images.filter((img) => !img.isNew && img.markedForDeletion);
        deletedImages.forEach((img) => {
          documents.push({
            id: img.id,
            actionState: DocumentActionState.Deleted,
          });
        });

        await updateAmenity(amenity.id, {
          ...basePayload,
          documents: documents.length > 0 ? documents : null,
          tempDocuments,
        });
      } else {
        // For create: just pass temp documents
        await createAmenity({
          ...basePayload,
          tempDocuments,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to save amenity:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save amenity. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step indicator
  const steps = [
    { key: 'basic', label: '1. Basic' },
    { key: 'booking', label: '2. Booking' },
    { key: 'deposit', label: '3. Deposit' },
    { key: 'images', label: '4. Images' },
  ];

  // Get active images count
  const activeImageCount = images.filter((img) => !img.markedForDeletion).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Amenity' : 'Add Amenity'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update amenity details, booking rules, and images.'
              : 'Configure a new amenity with booking rules and images.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step Indicator */}
          <div className="flex gap-1">
            {steps.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`flex-1 py-2 px-1 text-xs font-medium rounded-lg transition-colors ${
                  step === s.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => {
                  const currentIndex = steps.findIndex((st) => st.key === step);
                  const targetIndex = steps.findIndex((st) => st.key === s.key);
                  if (targetIndex < currentIndex) {
                    setStep(s.key as FormStep);
                  }
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Step 1: Basic Details */}
          {step === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <Input
                  placeholder="e.g., Party Hall A"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Code</label>
                  <Input
                    placeholder="e.g., PH-A"
                    value={formData.code}
                    onChange={(e) => updateField('code', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => updateField('type', v as AmenityType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AMENITY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => updateField('status', v as AmenityStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AMENITY_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Display Order
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <Input
                  placeholder="e.g., Near Block A, Ground Floor"
                  value={formData.locationText}
                  onChange={(e) => updateField('locationText', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  rows={3}
                  placeholder="Describe the amenity..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isVisibleInApp}
                  onChange={(e) => updateField('isVisibleInApp', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Visible in mobile app</span>
              </label>
            </div>
          )}

          {/* Step 2: Booking Rules */}
          {step === 'booking' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.isBookable}
                  onChange={(e) => updateField('isBookable', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Enable Booking</span>
                  <p className="text-xs text-gray-500">Allow residents to book this amenity</p>
                </div>
              </label>

              {formData.isBookable && (
                <>
                  <label className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.requiresApproval}
                      onChange={(e) => updateField('requiresApproval', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Requires Approval</span>
                      <p className="text-xs text-gray-500">
                        Bookings need admin approval before confirmation
                      </p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Operating Hours
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Open</label>
                        <Input
                          type="time"
                          value={formData.openTime}
                          onChange={(e) => updateField('openTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Close</label>
                        <Input
                          type="time"
                          value={formData.closeTime}
                          onChange={(e) => updateField('closeTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Slot Duration (min)
                      </label>
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={formData.slotDurationMinutes}
                        onChange={(e) =>
                          updateField('slotDurationMinutes', parseInt(e.target.value) || 60)
                        }

                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Cleanup Buffer (min)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.cleanupBufferMinutes}
                        onChange={(e) =>
                          updateField('cleanupBufferMinutes', parseInt(e.target.value) || 0)
                        }

                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Max Days in Advance
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.maxDaysInAdvance}
                        onChange={(e) =>
                          updateField('maxDaysInAdvance', parseInt(e.target.value) || 30)
                        }

                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Max Bookings/Unit
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="No limit"
                        value={formData.maxActiveBookingsPerUnit || ''}
                        onChange={(e) =>
                          updateField(
                            'maxActiveBookingsPerUnit',
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }

                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Max Guests
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="No limit"
                      value={formData.maxGuests || ''}
                      onChange={(e) =>
                        updateField('maxGuests', e.target.value ? parseInt(e.target.value) : null)
                      }

                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Deposit Settings */}
          {step === 'deposit' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.depositRequired}
                  onChange={(e) => updateField('depositRequired', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Require Deposit</span>
                  <p className="text-xs text-gray-500">
                    Residents must pay a deposit before booking is confirmed
                  </p>
                </div>
              </label>

              {formData.depositRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Deposit Amount
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.depositAmount || ''}
                    onChange={(e) =>
                      updateField(
                        'depositAmount',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }

                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deposit is tracked manually; system only records status &amp; reference.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Hidden file input - always in DOM for ref to work */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
          />

          {/* Step 4: Images */}
          {step === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Amenity Images</h4>
                  <p className="text-xs text-gray-500">
                    Add photos of the amenity ({activeImageCount}/{MAX_IMAGES})
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleAddImagesClick}
                  disabled={isUploading || activeImageCount >= MAX_IMAGES}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadProgress || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Add Images
                    </>
                  )}
                </Button>
              </div>

              {/* Image Grid */}
              {activeImageCount > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {images
                    .filter((img) => !img.markedForDeletion)
                    .map((image) => (
                      <div
                        key={image.id}
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                          image.isPrimary ? 'border-primary-500' : 'border-gray-200'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />

                        {/* Primary badge */}
                        {image.isPrimary && (
                          <div className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Primary
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!image.isPrimary && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSetPrimary(image.id)}
                              title="Set as primary"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveImage(image.id)}
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No images added yet</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    className="mt-2"
                    onClick={handleAddImagesClick}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Images
                  </Button>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Accepted formats: JPEG, PNG, GIF, WebP. Max {MAX_FILE_SIZE_MB}MB per file.
                Click star to set primary image shown in listings.
              </p>

              {/* Summary */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Summary</h4>
                <dl className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <dt>Name:</dt>
                    <dd className="font-medium">{formData.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Type:</dt>
                    <dd>{AMENITY_TYPE_OPTIONS.find((o) => o.value === formData.type)?.label}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Bookable:</dt>
                    <dd>{formData.isBookable ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Deposit:</dt>
                    <dd>
                      {formData.depositRequired
                        ? `$${formData.depositAmount?.toFixed(2) || '0.00'}`
                        : 'Not required'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Images:</dt>
                    <dd>{activeImageCount} uploaded</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            {step !== 'basic' && (
              <Button variant="secondary" onClick={handleBack} disabled={isSubmitting || isUploading}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              {step === 'images' ? (
                <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEdit ? (
                    'Update Amenity'
                  ) : (
                    'Create Amenity'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={isUploading}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
