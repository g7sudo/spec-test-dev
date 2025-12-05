'use client';

/**
 * Resident Profile Page (Flow 2)
 * Comprehensive view of a single resident
 * Shows party info, residency history, account status, and invites
 * 
 * Route: /tenant/[tenantSlug]/residents/[partyId]
 * Permission: TENANT_LEASE_VIEW (view) / TENANT_LEASE_MANAGE (actions)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Home,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Send,
  LogOut,
  Key,
  History,
  Star,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import { getResidentProfile } from '@/lib/api/residents';
import {
  ResidentProfile,
  ProfileResidency,
  getResidentStatusColor,
  getResidentRoleColor,
  formatResidentDate,
} from '@/types/resident';
import { LeasePartyRole } from '@/types/lease';
import { MoveOutResidentDialog } from '@/components/residents';
import { SendResidentInviteDialog } from '@/components/leases';
import {
  getInviteStatusColor,
  formatInviteExpiry,
} from '@/types/resident-invite';

// ============================================
// Helper: Get lease status color from text
// ============================================

function getLeaseStatusColor(statusText: string): string {
  switch (statusText) {
    case 'Draft': return 'bg-yellow-100 text-yellow-700';
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Ended': return 'bg-gray-100 text-gray-600';
    case 'Terminated': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

// ============================================
// Header Section
// ============================================

interface ProfileHeaderProps {
  profile: ResidentProfile;
  tenantSlug: string;
  canManage: boolean;
  onInvite: () => void;
}

function ProfileHeader({
  profile,
  tenantSlug,
  canManage,
  onInvite,
}: ProfileHeaderProps) {
  // Use statusText from API directly
  const statusText = profile.statusText;
  const isCurrent = statusText === 'Current';
  const hasAppAccess = profile.hasAppAccess;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        {/* Back button */}
        <Link href={`/tenant/${tenantSlug}/residents`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Avatar and info */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.residentName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
              {/* Status badges */}
              {isCurrent ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Current Resident
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  {statusText} Resident
                </span>
              )}

              {hasAppAccess ? (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Key className="h-4 w-4" />
                  Has App Access
                </span>
              ) : (
                <span className="text-gray-400">No App Access</span>
              )}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
              {profile.email && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canManage && isCurrent && !hasAppAccess && (
        <Button onClick={onInvite}>
          <Send className="h-4 w-4" />
          Invite to App
        </Button>
      )}
    </div>
  );
}

// ============================================
// Residency Card
// ============================================

interface ResidencyCardProps {
  residency: ProfileResidency;
  tenantSlug: string;
  canManage: boolean;
  onMoveOut: () => void;
  onInvite: () => void;
  hasAppAccess: boolean;
}

function ResidencyCard({
  residency,
  tenantSlug,
  canManage,
  onMoveOut,
  onInvite,
  hasAppAccess,
}: ResidencyCardProps) {
  const isCurrent = residency.isCurrent;
  const canDoMoveOut = canManage && isCurrent;
  const canDoInvite = canManage && !hasAppAccess && isCurrent;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isCurrent ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Unit info */}
          <Link
            href={`/tenant/${tenantSlug}/units/${residency.unit.unitId}`}
            className="flex items-center gap-2 font-medium text-gray-900 hover:text-primary-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            Unit {residency.unit.unitNumber}
            {residency.unit.blockName && (
              <span className="text-gray-500">• {residency.unit.blockName}</span>
            )}
          </Link>

          {/* Status and role badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getResidentStatusColor(
                isCurrent ? 'Current' : 'Past'
              )}`}
            >
              {isCurrent ? 'Current' : 'Past'}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getResidentRoleColor(
                residency.roleText
              )}`}
            >
              {residency.roleText}
            </span>
            {residency.isPrimary && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <Star className="h-3 w-3" />
                Primary
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Move-in: {formatResidentDate(residency.moveInDate)}
            </span>
            {residency.moveOutDate && (
              <span className="flex items-center gap-1">
                <LogOut className="h-3.5 w-3.5" />
                Move-out: {formatResidentDate(residency.moveOutDate)}
              </span>
            )}
          </div>

          {/* Lease info */}
          <div className="mt-2 text-sm text-gray-500">
            Lease: {formatResidentDate(residency.startDate)} →{' '}
            {residency.endDate
              ? formatResidentDate(residency.endDate)
              : 'Open-ended'}
            <span
              className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLeaseStatusColor(
                residency.leaseStatusText
              )}`}
            >
              {residency.leaseStatusText}
            </span>
          </div>

          {/* Co-residents */}
          {residency.coResidents && residency.coResidents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                Co-residents
              </p>
              <div className="flex flex-wrap gap-2">
                {residency.coResidents.map((co) => (
                  <Link
                    key={co.leasePartyId}
                    href={`/tenant/${tenantSlug}/residents/${co.partyId}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200 text-sm hover:bg-surface-50 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    {co.partyName}
                    {co.isPrimary && (
                      <Star className="h-3 w-3 text-amber-500" />
                    )}
                    {co.hasAppAccess && (
                      <Key className="h-3 w-3 text-blue-500" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canDoMoveOut || canDoInvite) && (
          <div className="flex flex-col gap-2 ml-4">
            {canDoInvite && (
              <Button variant="secondary" size="sm" onClick={onInvite}>
                <Send className="h-4 w-4" />
              </Button>
            )}
            {canDoMoveOut && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onMoveOut}
                className="text-amber-600 hover:text-amber-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Account Tab
// ============================================

interface AccountTabProps {
  profile: ResidentProfile;
  canManage: boolean;
  onInvite: () => void;
}

function AccountTab({ profile, canManage, onInvite }: AccountTabProps) {
  const hasAccount = profile.hasAppAccess;
  const isCurrent = profile.statusText === 'Current';
  const canSendInvite = canManage && !hasAccount && isCurrent;
  
  // Get latest pending invite
  const latestInvite = (profile.invites || []).find(
    (inv) => inv.statusText === 'Pending' || inv.isValid
  );

  return (
    <Card>
      <CardHeader
        title="Account & Access"
        description="App access and invitation status"
      />
      <CardContent className="space-y-6">
        {/* Account Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Community User Account
          </h4>
          {hasAccount ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">
                    Has App Access
                  </p>
                  {profile.loginEmail && (
                    <p className="text-sm text-green-600">
                      Email: {profile.loginEmail}
                    </p>
                  )}
                  {profile.lastLoginAt && (
                    <p className="text-sm text-green-600">
                      Last login:{' '}
                      {new Date(profile.lastLoginAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <XCircle className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-700">No App Access</p>
                  <p className="text-sm text-gray-500">
                    This resident hasn&apos;t signed up for the app yet
                  </p>
                </div>
                {canSendInvite && (
                  <Button onClick={onInvite}>
                    <Send className="h-4 w-4" />
                    Send Invite
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Latest Invite Status */}
        {latestInvite && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Latest Invitation
            </h4>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Sent to: {latestInvite.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatInviteExpiry(latestInvite.expiresAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInviteStatusColor(
                    latestInvite.statusText
                  )}`}
                >
                  {latestInvite.statusText}
                </span>
              </div>
              {canManage &&
                (latestInvite.statusText === 'Pending' || !latestInvite.isValid) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={onInvite}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resend Invite
                  </Button>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ResidentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const partyId = params.partyId as string;
  const { profile: authProfile } = useAuthStore();
  const fetchedRef = useRef(false);

  // State
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('residency');

  // Dialog state
  const [moveOutResidency, setMoveOutResidency] =
    useState<ProfileResidency | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteResidency, setInviteResidency] =
    useState<ProfileResidency | null>(null);

  // Permissions
  const permissions = authProfile?.permissions || {};
  const canManage = permissions['TENANT_LEASE_MANAGE'] === true;

  // Load profile
  const loadProfile = useCallback(
    async (force = false) => {
      if (!force && fetchedRef.current) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getResidentProfile(partyId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load resident profile:', err);
        setError('Failed to load resident profile');
        fetchedRef.current = false; // Allow retry on error
      } finally {
        setIsLoading(false);
      }
    },
    [partyId]
  );

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle move-out for a specific residency
  const handleMoveOut = (residency: ProfileResidency) => {
    setMoveOutResidency(residency);
  };

  // Handle invite for a specific residency
  const handleInviteFromResidency = (residency: ProfileResidency) => {
    setInviteResidency(residency);
    setShowInviteDialog(true);
  };

  // Handle invite from header (uses current residency)
  const handleInviteFromHeader = () => {
    const currentResidency = (profile?.residencies || []).find(r => r.isCurrent);
    if (currentResidency) {
      setInviteResidency(currentResidency);
      setShowInviteDialog(true);
    }
  };

  // Handle dialog success - use force refresh
  const handleDialogSuccess = () => {
    setMoveOutResidency(null);
    setShowInviteDialog(false);
    setInviteResidency(null);
    loadProfile(true); // Force bypasses guard
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading resident profile...</p>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Resident not found
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The resident you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Link href={`/tenant/${tenantSlug}/residents`}>
          <Button variant="secondary" className="mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Residents
          </Button>
        </Link>
      </div>
    );
  }

  const hasAppAccess = profile.hasAppAccess;
  const residencies = profile.residencies || [];
  const currentResidency = residencies.find(r => r.isCurrent);
  const pastResidencies = residencies.filter(r => !r.isCurrent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProfileHeader
        profile={profile}
        tenantSlug={tenantSlug}
        canManage={canManage}
        onInvite={handleInviteFromHeader}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="residency" icon={<Home className="h-4 w-4" />}>
            Residency ({residencies.length})
          </TabsTrigger>
          <TabsTrigger value="account" icon={<Key className="h-4 w-4" />}>
            Account
          </TabsTrigger>
        </TabsList>

        {/* Residency Tab */}
        <TabsContent value="residency">
          <Card>
            <CardHeader
              title="Residency History"
              description="Current and past residencies"
            />
            <CardContent>
              {residencies.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No residency records found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current residency first */}
                  {currentResidency && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Current Residency
                      </h4>
                      <ResidencyCard
                        residency={currentResidency}
                        tenantSlug={tenantSlug}
                        canManage={canManage}
                        onMoveOut={() => handleMoveOut(currentResidency)}
                        onInvite={() => handleInviteFromResidency(currentResidency)}
                        hasAppAccess={hasAppAccess}
                      />
                    </div>
                  )}

                  {/* Past residencies */}
                  {pastResidencies.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Past Residencies
                      </h4>
                      <div className="space-y-3">
                        {pastResidencies.map((residency) => (
                          <ResidencyCard
                            key={residency.leasePartyId}
                            residency={residency}
                            tenantSlug={tenantSlug}
                            canManage={canManage}
                            onMoveOut={() => handleMoveOut(residency)}
                            onInvite={() => handleInviteFromResidency(residency)}
                            hasAppAccess={hasAppAccess}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <AccountTab
            profile={profile}
            canManage={canManage}
            onInvite={handleInviteFromHeader}
          />
        </TabsContent>
      </Tabs>

      {/* Move Out Dialog */}
      {moveOutResidency && profile && (
        <MoveOutResidentDialog
          open={!!moveOutResidency}
          onOpenChange={(open) => !open && setMoveOutResidency(null)}
          resident={{
            leasePartyId: moveOutResidency.leasePartyId,
            partyId: profile.partyId,
            residentName: profile.residentName,
            partyType: profile.partyType,
            partyTypeText: profile.partyTypeText,
            leaseId: moveOutResidency.leaseId,
            leaseStatus: moveOutResidency.leaseStatus,
            leaseStatusText: moveOutResidency.leaseStatusText,
            startDate: moveOutResidency.startDate,
            endDate: moveOutResidency.endDate,
            unitId: moveOutResidency.unit.unitId,
            unitNumber: moveOutResidency.unit.unitNumber,
            blockName: moveOutResidency.unit.blockName,
            blockId: '',
            floorName: moveOutResidency.unit.floorName,
            floorId: '',
            status: moveOutResidency.isCurrent ? 0 : 2,
            statusText: moveOutResidency.isCurrent ? 'Current' : 'Past',
            role: moveOutResidency.role,
            roleText: moveOutResidency.roleText,
            isPrimary: moveOutResidency.isPrimary,
            hasAppAccess: profile.hasAppAccess,
            communityUserId: profile.communityUserId,
            moveInDate: moveOutResidency.moveInDate,
            moveOutDate: moveOutResidency.moveOutDate,
            email: profile.email,
            phone: profile.phone,
          }}
          coResidents={(moveOutResidency.coResidents || []).map((co) => ({
            leasePartyId: co.leasePartyId,
            partyId: co.partyId,
            residentName: co.partyName,
            partyType: 0,
            partyTypeText: 'Individual',
            leaseId: moveOutResidency.leaseId,
            leaseStatus: moveOutResidency.leaseStatus,
            leaseStatusText: moveOutResidency.leaseStatusText,
            startDate: moveOutResidency.startDate,
            endDate: moveOutResidency.endDate,
            unitId: moveOutResidency.unit.unitId,
            unitNumber: moveOutResidency.unit.unitNumber,
            blockName: moveOutResidency.unit.blockName,
            blockId: '',
            floorName: moveOutResidency.unit.floorName,
            floorId: '',
            status: 0,
            statusText: 'Current',
            role: co.role,
            roleText: co.roleText,
            isPrimary: co.isPrimary,
            hasAppAccess: co.hasAppAccess,
            communityUserId: null,
            moveInDate: null,
            moveOutDate: null,
            email: null,
            phone: null,
          }))}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Invite Dialog */}
      {showInviteDialog && inviteResidency && profile && (
        <SendResidentInviteDialog
          open={showInviteDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowInviteDialog(false);
              setInviteResidency(null);
            }
          }}
          leaseId={inviteResidency.leaseId}
          leaseParty={{
            id: inviteResidency.leasePartyId,
            leaseId: inviteResidency.leaseId,
            partyId: profile.partyId,
            partyName: profile.residentName,
            partyType: profile.partyType,
            communityUserId: profile.communityUserId,
            role: inviteResidency.role as LeasePartyRole,
            isPrimary: inviteResidency.isPrimary,
            moveInDate: inviteResidency.moveInDate,
            moveOutDate: inviteResidency.moveOutDate,
            hasAppAccount: hasAppAccess,
            isCurrentlyResiding: inviteResidency.isCurrent,
            isActive: true,
          }}
          partyEmail={profile.email}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}

