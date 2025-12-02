'use client';

/**
 * My Profile Page
 * Tabbed interface for managing profile, privacy, and notifications
 * Matches F-PROFILE-01 and F-PROFILE-02 flows from docs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Globe,
  Key,
  LogOut,
  Loader2,
  AlertCircle,
  Bell,
  Eye,
  Settings,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import { useScopeStore } from '@/lib/store/scope-store';
import { useAuth } from '@/providers/AuthProvider';
import { MyCommunityProfile } from '@/types/profile';
import { getMyProfile } from '@/lib/api/profile';
import {
  ProfileBasicsForm,
  PrivacySettingsForm,
  NotificationSettingsForm,
} from '@/components/profile';

// ============================================
// Profile Header Component
// ============================================

function ProfileHeader() {
  const { user, profile: authProfile } = useAuthStore();
  const displayName = authProfile?.displayName || user?.displayName || 'User';
  const email = authProfile?.email || user?.email || '';

  return (
    <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
      <Avatar
        src={user?.photoURL}
        name={displayName}
        size="lg"
        className="h-16 w-16 text-xl"
      />
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
}

// ============================================
// Account Tab Content
// ============================================

function AccountTabContent() {
  const { user, profile } = useAuthStore();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = profile?.displayName || user?.displayName || '';
  const email = profile?.email || user?.email || '';
  const phone = profile?.phoneNumber || '';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader
          title="Account Information"
          description="Your identity provider details"
        />
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Display Name"
              value={displayName || 'Not set'}
              leftAddon={<User className="h-4 w-4" />}
              disabled
            />
            <Input
              label="Email"
              value={email}
              leftAddon={<Mail className="h-4 w-4" />}
              disabled
            />
            <Input
              label="Phone"
              value={phone || 'Not set'}
              leftAddon={<Phone className="h-4 w-4" />}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader
          title="Security"
          description="Manage your account security"
        />
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-surface-50 p-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Change via identity provider</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" disabled>
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-error/20 bg-error/5 p-4">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-error" />
              <div>
                <p className="font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-500">End your session</p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              isLoading={isLoggingOut}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Roles Tab Content
// ============================================

function RolesTabContent() {
  const { profile } = useAuthStore();
  const globalRoles = profile?.globalRoles || [];
  const tenantMemberships = profile?.tenantMemberships || [];

  return (
    <div className="space-y-6">
      {/* Platform Roles */}
      <Card>
        <CardHeader
          title="Platform Roles"
          description="Your global platform permissions"
        />
        <CardContent>
          {globalRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {globalRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No platform roles assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Community Access */}
      <Card>
        <CardHeader
          title="Community Access"
          description="Communities you belong to"
        />
        <CardContent>
          {tenantMemberships.length > 0 ? (
            <div className="space-y-3">
              {tenantMemberships.map((m) => (
                <div
                  key={m.tenantId}
                  className="flex items-center justify-between rounded-lg bg-surface-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <Building2 className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{m.tenantName}</p>
                      <p className="text-xs text-gray-500">{m.tenantSlug}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {m.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No community memberships</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Community Profile Tabs (when in tenant scope)
// ============================================

interface CommunityProfileTabsProps {
  profile: MyCommunityProfile;
  onUpdate: () => void;
}

function CommunityProfileTabs({ profile, onUpdate }: CommunityProfileTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="profile" icon={<User className="h-4 w-4" />}>
          Profile
        </TabsTrigger>
        <TabsTrigger value="privacy" icon={<Eye className="h-4 w-4" />}>
          Privacy
        </TabsTrigger>
        <TabsTrigger value="notifications" icon={<Bell className="h-4 w-4" />}>
          Notifications
        </TabsTrigger>
        <TabsTrigger value="account" icon={<Settings className="h-4 w-4" />}>
          Account
        </TabsTrigger>
        <TabsTrigger value="roles" icon={<Shield className="h-4 w-4" />}>
          Roles
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileBasicsForm profile={profile} onUpdate={onUpdate} />
      </TabsContent>

      <TabsContent value="privacy">
        <PrivacySettingsForm profile={profile} onUpdate={onUpdate} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationSettingsForm profile={profile} onUpdate={onUpdate} />
      </TabsContent>

      <TabsContent value="account">
        <AccountTabContent />
      </TabsContent>

      <TabsContent value="roles">
        <RolesTabContent />
      </TabsContent>
    </Tabs>
  );
}

// ============================================
// Platform Profile Tabs (when NOT in tenant scope)
// ============================================

function PlatformProfileTabs() {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList>
        <TabsTrigger value="account" icon={<Settings className="h-4 w-4" />}>
          Account
        </TabsTrigger>
        <TabsTrigger value="roles" icon={<Shield className="h-4 w-4" />}>
          Roles & Access
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <AccountTabContent />
      </TabsContent>

      <TabsContent value="roles">
        <RolesTabContent />
      </TabsContent>
    </Tabs>
  );
}

// ============================================
// Main Profile Page
// ============================================

export default function ProfilePage() {
  const { tenantId } = useScopeStore();
  const [communityProfile, setCommunityProfile] = useState<MyCommunityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  const isInTenantScope = !!tenantId;

  // Fetch community profile when in tenant scope
  const fetchProfile = useCallback(async (force = false) => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    // Skip if already fetched (Strict Mode guard), unless forced
    if (fetchedRef.current && !force) {
      return;
    }
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyProfile();
      setCommunityProfile(data);
    } catch (err) {
      console.error('Failed to fetch community profile:', err);
      setError('Failed to load community profile');
      fetchedRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchedRef.current = false; // Reset when tenantId changes
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile header card */}
      <Card>
        <CardContent className="pt-6">
          <ProfileHeader />
        </CardContent>
      </Card>

      {/* Content based on scope */}
      {isInTenantScope ? (
        // Tenant scope - show loading/error/community profile
        isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="mt-3 text-gray-500">Loading profile...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-error" />
                <p className="mt-3 font-medium text-gray-900">{error}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchProfile(true)}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : communityProfile ? (
          <CommunityProfileTabs profile={communityProfile} onUpdate={() => fetchProfile(true)} />
        ) : (
          <PlatformProfileTabs />
        )
      ) : (
        // Platform scope - show platform tabs
        <PlatformProfileTabs />
      )}
    </div>
  );
}
