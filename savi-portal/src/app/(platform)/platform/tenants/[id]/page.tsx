'use client';

/**
 * Tenant Detail Page
 * View and manage a single tenant/community
 * Permission: PLATFORM_TENANT_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Edit,
  UserPlus,
  Archive,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  Globe,
  Loader2,
  AlertCircle,
  Calendar,
  Server,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { getTenantById, archiveTenant } from '@/lib/api/tenants';
import {
  Tenant,
  getTenantStatusLabel,
  getTenantStatusColor,
  formatTenantAddress,
} from '@/types/tenant';
import { TenantFormDialog, InviteAdminDialog } from '@/components/tenants';

// ============================================
// Info Row Component
// ============================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  className?: string;
}

function InfoRow({ icon, label, value, className = '' }: InfoRowProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900">
          {value || <span className="text-gray-400">Not set</span>}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  // State
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['PLATFORM_TENANT_MANAGE'] === true;
  const canUpdate = permissions['PLATFORM_TENANT_UPDATE'] === true;

  // Fetch tenant
  const fetchTenant = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) {
      return;
    }
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTenantById(tenantId);
      setTenant(data);
    } catch (err) {
      console.error('Failed to fetch tenant:', err);
      setError('Failed to load community details');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchTenant();
  }, [fetchTenant]);

  // Handle archive
  const handleArchive = async () => {
    if (!tenant) return;
    
    if (!confirm(`Are you sure you want to archive "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await archiveTenant(tenant.id);
      router.push('/platform/tenants');
    } catch (err) {
      console.error('Failed to archive tenant:', err);
      alert('Failed to archive community. Please try again.');
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditOpen(false);
    fetchTenant(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading community...</p>
      </div>
    );
  }

  // Error state
  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Community not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/platform/tenants')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Communities
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/platform/tenants')}
        className="text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Communities
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{tenant.code}</span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getTenantStatusColor(
                  tenant.status
                )}`}
              >
                {getTenantStatusLabel(tenant.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canUpdate && (
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canManage && (
            <>
              <Button variant="secondary" onClick={() => setIsInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Invite Admin
              </Button>
              <Button variant="danger" onClick={handleArchive}>
                <Archive className="h-4 w-4" />
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Address Card */}
        <Card>
          <CardHeader
            title="Address"
            description="Community location"
          />
          <CardContent className="space-y-4">
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Full Address"
              value={formatTenantAddress(tenant)}
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={<Globe className="h-4 w-4" />}
                label="Country"
                value={tenant.country}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Timezone"
                value={tenant.timezone}
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact Card */}
        <Card>
          <CardHeader
            title="Primary Contact"
            description="Main point of contact"
          />
          <CardContent className="space-y-4">
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Name"
              value={tenant.primaryContactName}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={tenant.primaryContactEmail}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={tenant.primaryContactPhone}
            />
          </CardContent>
        </Card>

        {/* Technical Details Card */}
        <Card>
          <CardHeader
            title="Technical Details"
            description="System information"
          />
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Server className="h-4 w-4" />}
              label="Database Provider"
              value={tenant.provider}
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Created"
                value={new Date(tenant.createdAt).toLocaleDateString()}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Last Updated"
                value={tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleDateString() : null}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader
            title="Status"
            description="Current state of the community"
          />
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  tenant.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <div
                  className={`h-3 w-3 rounded-full ${
                    tenant.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {getTenantStatusLabel(tenant.status)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <TenantFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        tenant={tenant}
        onSuccess={handleEditSuccess}
      />

      {/* Invite Admin Dialog */}
      <InviteAdminDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        tenant={tenant}
      />
    </div>
  );
}

