'use client';

/**
 * Profile Basics Form
 * Editable display settings: name, about me, profile photo
 * Supports two-step photo upload flow:
 *   1. Upload to temp storage
 *   2. Update profile with temp key
 */

import { useState, useEffect, useRef } from 'react';
import { User, Camera, Save, X, Upload, Loader2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  MyCommunityProfile,
  UpdateProfileRequest,
  getProfileDisplayName,
} from '@/types/profile';
import { updateProfile, uploadTempFile, generateTempKey } from '@/lib/api/profile';
import { getIdToken } from '@/lib/auth/firebase';

// ============================================
// Constants
// ============================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================
// Props
// ============================================

interface ProfileBasicsFormProps {
  profile: MyCommunityProfile;
  onUpdate: () => void;
}

// ============================================
// Component
// ============================================

export function ProfileBasicsForm({ profile, onUpdate }: ProfileBasicsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [aboutMe, setAboutMe] = useState(profile.aboutMe || '');
  
  // Photo upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedTempKey, setUploadedTempKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  // Reset form when profile changes
  useEffect(() => {
    setDisplayName(profile.displayName || '');
    setAboutMe(profile.aboutMe || '');
    setUploadedTempKey(null);
    setPreviewUrl(null);
    setRemovePhoto(false);
  }, [profile]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ============================================
  // Handlers
  // ============================================

  // Cancel editing
  const handleCancel = () => {
    setDisplayName(profile.displayName || '');
    setAboutMe(profile.aboutMe || '');
    setUploadedTempKey(null);
    setRemovePhoto(false);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsEditing(false);
    setError(null);
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Step 1: Generate tempKey and upload to temp storage
      const tempKey = generateTempKey();
      
      const response = await uploadTempFile(file, tempKey, getIdToken);

      // Store the temp key for use in profile update
      setUploadedTempKey(tempKey);
      setRemovePhoto(false);
      
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(objectUrl);
      
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle photo removal
  const handleRemovePhoto = () => {
    setUploadedTempKey(null);
    setRemovePhoto(true);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Build request with only the fields that need updating
      const request: UpdateProfileRequest = {
        displayName: displayName || null,
        aboutMe: aboutMe || null,
      };

      // Handle photo updates - only include photo field if there's a change
      if (uploadedTempKey) {
        // New photo uploaded - use temp key from upload response
        request.tempProfilePhoto = uploadedTempKey;
        console.log('[Profile] Saving with tempProfilePhoto:', uploadedTempKey);
      } else if (removePhoto) {
        // Photo removed - explicitly set to null
        request.profilePhotoDocumentId = null;
        console.log('[Profile] Removing photo');
      }
      // If no photo change, don't send any photo field - backend keeps existing

      console.log('[Profile] Update request:', JSON.stringify(request));
      await updateProfile(request);
      
      setIsEditing(false);
      setUploadedTempKey(null);
      setRemovePhoto(false);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasChanges =
    displayName !== (profile.displayName || '') ||
    aboutMe !== (profile.aboutMe || '') ||
    uploadedTempKey !== null ||
    removePhoto;

  // Determine which photo to show
  const displayPhotoUrl = previewUrl || (!removePhoto ? profile.profilePhotoUrl : null);
  const hasExistingPhoto = profile.profilePhotoUrl && !removePhoto && !previewUrl;

  return (
    <Card>
      <CardHeader
        title="Display Settings"
        description="How you appear to others in the community"
        action={
          !isEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : null
        }
      />
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar section with upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                src={displayPhotoUrl}
                name={getProfileDisplayName(profile)}
                size="lg"
                className="h-24 w-24 text-2xl ring-4 ring-surface-100"
              />
              
              {/* Upload/Change button overlay */}
              {isEditing && (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={displayPhotoUrl ? 'Change photo' : 'Upload photo'}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {/* Photo label and actions */}
            <div className="text-center">
              <p className="text-sm text-gray-500">Profile photo</p>
              
              {isEditing && (
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : (displayPhotoUrl ? 'Change' : 'Upload')}
                  </button>
                  
                  {(hasExistingPhoto || previewUrl) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="text-xs text-error hover:text-error/80 font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload status indicator */}
            {isEditing && uploadedTempKey && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                <Upload className="h-3 w-3" />
                New photo ready
              </span>
            )}
            
            {isEditing && removePhoto && profile.profilePhotoUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                <Trash2 className="h-3 w-3" />
                Will be removed
              </span>
            )}
          </div>

          {/* Form fields */}
          <div className="flex-1 space-y-4">
            {/* Display Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Display Name
              </label>
              {isEditing ? (
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  leftAddon={<User className="h-4 w-4" />}
                  maxLength={200}
                />
              ) : (
                <p className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2.5 text-gray-900">
                  <User className="h-4 w-4 text-gray-400" />
                  {profile.displayName || (
                    <span className="text-gray-400">
                      {profile.partyName || 'Not set'}
                    </span>
                  )}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This name will be shown to other community members
                {!profile.displayName && profile.partyName && !isEditing && (
                  <span className="text-gray-400"> (showing party name as fallback)</span>
                )}
              </p>
            </div>

            {/* About Me */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                About Me
              </label>
              {isEditing ? (
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Tell others a bit about yourself..."
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
                />
              ) : (
                <p className="rounded-lg bg-surface-50 px-3 py-2.5 text-gray-900 min-h-[4rem]">
                  {profile.aboutMe || (
                    <span className="text-gray-400">No bio added yet</span>
                  )}
                </p>
              )}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-400">
                  {aboutMe.length}/2000 characters
                </p>
              )}
            </div>

            {/* Read-only contact info from Party */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Contact Information (Read-only)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-50 px-3 py-2">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">
                    {profile.primaryEmail || 'Not set'}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-50 px-3 py-2">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">
                    {profile.primaryPhone || 'Not set'}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                To update contact information, please contact your community administrator.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}

            {/* Action buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={!hasChanges || isUploading}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving || isUploading}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
