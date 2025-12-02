'use client';

/**
 * Privacy Settings Form
 * Controls directory visibility and what information is shown
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Users, Building2, Save, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MyCommunityProfile,
  UpdatePrivacySettingsRequest,
  DirectoryVisibilityScope,
  getVisibilityLabel,
} from '@/types/profile';
import { updatePrivacySettings } from '@/lib/api/profile';

// ============================================
// Props
// ============================================

interface PrivacySettingsFormProps {
  profile: MyCommunityProfile;
  onUpdate: () => void;
}

// ============================================
// Toggle Component
// ============================================

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/20
          ${checked ? 'bg-primary-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
            ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </label>
  );
}

// ============================================
// Component
// ============================================

export function PrivacySettingsForm({ profile, onUpdate }: PrivacySettingsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [visibility, setVisibility] = useState(profile.directoryVisibility);
  const [showInDirectory, setShowInDirectory] = useState(profile.showInDirectory);
  const [showName, setShowName] = useState(profile.showNameInDirectory);
  const [showUnit, setShowUnit] = useState(profile.showUnitInDirectory);
  const [showPhone, setShowPhone] = useState(profile.showPhoneInDirectory);
  const [showEmail, setShowEmail] = useState(profile.showEmailInDirectory);
  const [showPhoto, setShowPhoto] = useState(profile.showProfilePhotoInDirectory);

  // Reset form when profile changes
  useEffect(() => {
    setVisibility(profile.directoryVisibility);
    setShowInDirectory(profile.showInDirectory);
    setShowName(profile.showNameInDirectory);
    setShowUnit(profile.showUnitInDirectory);
    setShowPhone(profile.showPhoneInDirectory);
    setShowEmail(profile.showEmailInDirectory);
    setShowPhoto(profile.showProfilePhotoInDirectory);
  }, [profile]);

  // Cancel editing
  const handleCancel = () => {
    setVisibility(profile.directoryVisibility);
    setShowInDirectory(profile.showInDirectory);
    setShowName(profile.showNameInDirectory);
    setShowUnit(profile.showUnitInDirectory);
    setShowPhone(profile.showPhoneInDirectory);
    setShowEmail(profile.showEmailInDirectory);
    setShowPhoto(profile.showProfilePhotoInDirectory);
    setIsEditing(false);
    setError(null);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const request: UpdatePrivacySettingsRequest = {
        directoryVisibility: visibility,
        showInDirectory,
        showNameInDirectory: showName,
        showUnitInDirectory: showUnit,
        showPhoneInDirectory: showPhone,
        showEmailInDirectory: showEmail,
        showProfilePhotoInDirectory: showPhoto,
      };

      await updatePrivacySettings(request);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Visibility options
  const visibilityOptions = [
    { value: DirectoryVisibilityScope.Hidden, icon: EyeOff, label: 'Hidden' },
    { value: DirectoryVisibilityScope.BlockOnly, icon: Building2, label: 'Block Only' },
    { value: DirectoryVisibilityScope.Community, icon: Users, label: 'Community' },
  ];

  return (
    <Card>
      <CardHeader
        title="Privacy & Directory"
        description="Control how you appear in the resident directory"
        action={
          !isEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : null
        }
      />
      <CardContent className="space-y-6">
        {/* Directory Visibility */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Directory Visibility
          </label>
          {isEditing ? (
            <div className="flex gap-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium
                      transition-colors border-2
                      ${isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2.5 text-gray-900">
              <Eye className="h-4 w-4 text-gray-400" />
              {getVisibilityLabel(profile.directoryVisibility)}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Who can see your profile in the community directory
          </p>
        </div>

        {/* Toggle Settings */}
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-sm font-medium text-gray-700">
            What to show in directory
          </p>
          <div className="divide-y divide-gray-100">
            <Toggle
              label="Show in directory"
              description="Allow your profile to appear in searches"
              checked={showInDirectory}
              onChange={setShowInDirectory}
              disabled={!isEditing}
            />
            <Toggle
              label="Show name"
              checked={showName}
              onChange={setShowName}
              disabled={!isEditing || !showInDirectory}
            />
            <Toggle
              label="Show unit number"
              checked={showUnit}
              onChange={setShowUnit}
              disabled={!isEditing || !showInDirectory}
            />
            <Toggle
              label="Show phone number"
              checked={showPhone}
              onChange={setShowPhone}
              disabled={!isEditing || !showInDirectory}
            />
            <Toggle
              label="Show email address"
              checked={showEmail}
              onChange={setShowEmail}
              disabled={!isEditing || !showInDirectory}
            />
            <Toggle
              label="Show profile photo"
              checked={showPhoto}
              onChange={setShowPhoto}
              disabled={!isEditing || !showInDirectory}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        {/* Action buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

