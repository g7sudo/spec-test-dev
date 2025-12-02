'use client';

/**
 * Notification Settings Form
 * Controls notification preferences (push, email, categories)
 */

import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Wrench,
  Calendar,
  Users,
  Megaphone,
  Store,
  Save,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MyCommunityProfile, UpdateNotificationSettingsRequest } from '@/types/profile';
import { updateNotificationSettings } from '@/lib/api/profile';

// ============================================
// Props
// ============================================

interface NotificationSettingsFormProps {
  profile: MyCommunityProfile;
  onUpdate: () => void;
}

// ============================================
// Toggle Component
// ============================================

interface ToggleProps {
  label: string;
  description?: string;
  icon?: React.ElementType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, description, icon: Icon, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
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

export function NotificationSettingsForm({ profile, onUpdate }: NotificationSettingsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - delivery methods
  const [pushEnabled, setPushEnabled] = useState(profile.pushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(profile.emailEnabled);

  // Form state - notification categories
  const [notifyMaintenance, setNotifyMaintenance] = useState(profile.notifyMaintenanceUpdates);
  const [notifyAmenity, setNotifyAmenity] = useState(profile.notifyAmenityBookings);
  const [notifyVisitor, setNotifyVisitor] = useState(profile.notifyVisitorAtGate);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(profile.notifyAnnouncements);
  const [notifyMarketplace, setNotifyMarketplace] = useState(profile.notifyMarketplace);

  // Reset form when profile changes
  useEffect(() => {
    setPushEnabled(profile.pushEnabled);
    setEmailEnabled(profile.emailEnabled);
    setNotifyMaintenance(profile.notifyMaintenanceUpdates);
    setNotifyAmenity(profile.notifyAmenityBookings);
    setNotifyVisitor(profile.notifyVisitorAtGate);
    setNotifyAnnouncements(profile.notifyAnnouncements);
    setNotifyMarketplace(profile.notifyMarketplace);
  }, [profile]);

  // Cancel editing
  const handleCancel = () => {
    setPushEnabled(profile.pushEnabled);
    setEmailEnabled(profile.emailEnabled);
    setNotifyMaintenance(profile.notifyMaintenanceUpdates);
    setNotifyAmenity(profile.notifyAmenityBookings);
    setNotifyVisitor(profile.notifyVisitorAtGate);
    setNotifyAnnouncements(profile.notifyAnnouncements);
    setNotifyMarketplace(profile.notifyMarketplace);
    setIsEditing(false);
    setError(null);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const request: UpdateNotificationSettingsRequest = {
        pushEnabled,
        emailEnabled,
        notifyMaintenanceUpdates: notifyMaintenance,
        notifyAmenityBookings: notifyAmenity,
        notifyVisitorAtGate: notifyVisitor,
        notifyAnnouncements,
        notifyMarketplace,
      };

      await updateNotificationSettings(request);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if any notifications are enabled
  const anyEnabled = pushEnabled || emailEnabled;

  return (
    <Card>
      <CardHeader
        title="Notifications"
        description="Choose how and when you want to be notified"
        action={
          !isEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : null
        }
      />
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Delivery Methods</p>
          <div className="divide-y divide-gray-100 rounded-lg bg-surface-50 px-4">
            <Toggle
              label="Push Notifications"
              description="Receive alerts on your device"
              icon={Smartphone}
              checked={pushEnabled}
              onChange={setPushEnabled}
              disabled={!isEditing}
            />
            <Toggle
              label="Email Notifications"
              description="Receive updates via email"
              icon={Mail}
              checked={emailEnabled}
              onChange={setEmailEnabled}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Notification Categories */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Notification Categories</p>
          <div className="divide-y divide-gray-100 rounded-lg bg-surface-50 px-4">
            <Toggle
              label="Maintenance Updates"
              description="Status changes on your service requests"
              icon={Wrench}
              checked={notifyMaintenance}
              onChange={setNotifyMaintenance}
              disabled={!isEditing || !anyEnabled}
            />
            <Toggle
              label="Amenity Bookings"
              description="Confirmations and reminders"
              icon={Calendar}
              checked={notifyAmenity}
              onChange={setNotifyAmenity}
              disabled={!isEditing || !anyEnabled}
            />
            <Toggle
              label="Visitor at Gate"
              description="When a visitor arrives for you"
              icon={Users}
              checked={notifyVisitor}
              onChange={setNotifyVisitor}
              disabled={!isEditing || !anyEnabled}
            />
            <Toggle
              label="Announcements"
              description="Important community updates"
              icon={Megaphone}
              checked={notifyAnnouncements}
              onChange={setNotifyAnnouncements}
              disabled={!isEditing || !anyEnabled}
            />
            <Toggle
              label="Marketplace"
              description="Activity on your listings"
              icon={Store}
              checked={notifyMarketplace}
              onChange={setNotifyMarketplace}
              disabled={!isEditing || !anyEnabled}
            />
          </div>
          {!anyEnabled && (
            <p className="mt-2 text-xs text-amber-600">
              Enable at least one delivery method to receive notifications
            </p>
          )}
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

