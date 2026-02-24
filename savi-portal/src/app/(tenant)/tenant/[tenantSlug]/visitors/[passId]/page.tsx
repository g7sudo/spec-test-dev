'use client';

/**
 * Visitor Pass Detail Page
 * Shows full pass details, workflow actions, timeline, and status info
 * Entry point: /tenant/[tenantSlug]/visitors/[passId]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Users,
  Home,
  User,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  Ban,
  Edit,
  Phone,
  Car,
  Key,
  Bell,
  FileText,
  Truck,
  Shield,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getVisitorPassById,
  approveVisitorPass,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitorPass,
} from '@/lib/api/visitors';
import {
  VisitorPass,
  VisitorPassStatus,
  getVisitorPassStatusLabel,
  getVisitorPassStatusColor,
  getVisitorTypeLabel,
  getVisitorTypeColor,
  getVisitorSourceLabel,
  formatDateTime,
} from '@/types/visitor';
import { RejectPassDialog, UpdatePassDialog } from '@/components/visitors';

// ============================================
// Main Component
// ============================================

export default function VisitorPassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const passId = params.passId as string;

  // Refs for Strict Mode guard
  const passFetchedRef = useRef(false);

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView =
    permissions['TENANT_VISITOR_VIEW'] === true ||
    permissions['TENANT_VISITOR_MANAGE'] === true;
  const canManage = permissions['TENANT_VISITOR_MANAGE'] === true;
  const canCreate =
    permissions['TENANT_VISITOR_CREATE'] === true ||
    permissions['TENANT_VISITOR_CREATE_OWN'] === true ||
    permissions['TENANT_VISITOR_CREATE_UNIT'] === true;

  // Data state
  const [pass, setPass] = useState<VisitorPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action loading states
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  // ============================================
  // Data Loading
  // ============================================

  const loadPass = useCallback(
    async (force = false) => {
      if (!canView) return;
      if (!force && passFetchedRef.current) return;
      passFetchedRef.current = true;

      try {
        const data = await getVisitorPassById(passId);
        setPass(data);
      } catch (err) {
        console.error('Failed to load visitor pass:', err);
        setError('Failed to load visitor pass');
        passFetchedRef.current = false;
      }
    },
    [canView, passId]
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadPass().finally(() => {
      setIsLoading(false);
    });
  }, [loadPass]);

  // Refresh data
  const refreshAll = useCallback(() => {
    passFetchedRef.current = false;
    loadPass(true);
  }, [loadPass]);

  // ============================================
  // Workflow Actions
  // ============================================

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await approveVisitorPass(passId);
      refreshAll();
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      await checkInVisitor(passId);
      refreshAll();
    } catch (err) {
      console.error('Failed to check in:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      await checkOutVisitor(passId);
      refreshAll();
    } catch (err) {
      console.error('Failed to check out:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsActionLoading(true);
    try {
      await cancelVisitorPass(passId);
      refreshAll();
    } catch (err) {
      console.error('Failed to cancel:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ============================================
  // Dialog Success Handlers
  // ============================================

  const handleDialogSuccess = () => {
    setShowRejectDialog(false);
    setShowUpdateDialog(false);
    refreshAll();
  };

  // ============================================
  // Determine available actions based on status
  // ============================================

  const status = pass?.status;
  const canApprove =
    canManage &&
    (status === VisitorPassStatus.PreRegistered ||
      status === 'PreRegistered' ||
      status === VisitorPassStatus.AtGatePendingApproval ||
      status === 'AtGatePendingApproval');
  const canReject =
    canManage &&
    (status === VisitorPassStatus.PreRegistered ||
      status === 'PreRegistered' ||
      status === VisitorPassStatus.AtGatePendingApproval ||
      status === 'AtGatePendingApproval');
  const canCheckIn =
    canManage &&
    (status === VisitorPassStatus.PreRegistered ||
      status === 'PreRegistered' ||
      status === VisitorPassStatus.Approved ||
      status === 'Approved');
  const canCheckOut =
    canManage &&
    (status === VisitorPassStatus.CheckedIn || status === 'CheckedIn');
  const canCancelPass =
    canManage &&
    ![
      VisitorPassStatus.CheckedIn,
      'CheckedIn',
      VisitorPassStatus.CheckedOut,
      'CheckedOut',
      VisitorPassStatus.Cancelled,
      'Cancelled',
      VisitorPassStatus.Expired,
      'Expired',
    ].includes(status as VisitorPassStatus);
  const canEdit =
    (canManage || canCreate) &&
    ![
      VisitorPassStatus.CheckedIn,
      'CheckedIn',
      VisitorPassStatus.CheckedOut,
      'CheckedOut',
    ].includes(status as VisitorPassStatus);

  // ============================================
  // Loading & Error States
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view this visitor pass.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error || 'Visitor pass not found'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/tenant/${tenantSlug}/visitors`)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Visitors
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{pass.visitorName}</h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getVisitorPassStatusColor(pass.status)}`}
            >
              {getVisitorPassStatusLabel(pass.status)}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getVisitorTypeColor(pass.visitType)}`}
            >
              {getVisitorTypeLabel(pass.visitType)}
            </span>
          </div>
          {pass.accessCode && (
            <p className="text-sm text-gray-500 mt-1">
              Access Code: <span className="font-mono font-medium text-gray-700">{pass.accessCode}</span>
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canApprove && (
            <Button onClick={handleApprove} disabled={isActionLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {canCheckIn && (
            <Button onClick={handleCheckIn} disabled={isActionLoading}>
              <LogIn className="h-4 w-4 mr-2" />
              Check In
            </Button>
          )}
          {canCheckOut && (
            <Button onClick={handleCheckOut} disabled={isActionLoading}>
              <LogOut className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          )}
          {canEdit && (
            <Button variant="secondary" onClick={() => setShowUpdateDialog(true)} disabled={isActionLoading}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canReject && (
            <Button variant="danger" onClick={() => setShowRejectDialog(true)} disabled={isActionLoading}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          {canCancelPass && (
            <Button variant="secondary" onClick={handleCancel} disabled={isActionLoading}>
              <Ban className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pass Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader title="Pass Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Home className="h-4 w-4" /> Unit
                  </dt>
                  <dd className="font-medium">
                    {pass.blockName && `${pass.blockName} - `}
                    {pass.unitNumber || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Tag className="h-4 w-4" /> Visit Type
                  </dt>
                  <dd className="font-medium">{getVisitorTypeLabel(pass.visitType)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Shield className="h-4 w-4" /> Source
                  </dt>
                  <dd className="font-medium">{getVisitorSourceLabel(pass.source)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Key className="h-4 w-4" /> Access Code
                  </dt>
                  <dd className="font-mono font-medium">{pass.accessCode || '-'}</dd>
                </div>
                {pass.visitorPhone && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Phone
                    </dt>
                    <dd className="font-medium">{pass.visitorPhone}</dd>
                  </div>
                )}
                {pass.requestedForUserName && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <User className="h-4 w-4" /> Requested For
                    </dt>
                    <dd className="font-medium">{pass.requestedForUserName}</dd>
                  </div>
                )}
                {pass.vehicleNumber && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Car className="h-4 w-4" /> Vehicle
                    </dt>
                    <dd className="font-medium">
                      {pass.vehicleNumber}
                      {pass.vehicleType && ` (${pass.vehicleType})`}
                    </dd>
                  </div>
                )}
                {pass.deliveryProvider && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Truck className="h-4 w-4" /> Delivery Provider
                    </dt>
                    <dd className="font-medium">{pass.deliveryProvider}</dd>
                  </div>
                )}
                {pass.visitorIdType && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <FileText className="h-4 w-4" /> ID Document
                    </dt>
                    <dd className="font-medium">
                      {pass.visitorIdType}
                      {pass.visitorIdNumber && `: ${pass.visitorIdNumber}`}
                    </dd>
                  </div>
                )}
                {(pass.expectedFrom || pass.expectedTo) && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Expected Window
                    </dt>
                    <dd className="font-medium">
                      {formatDateTime(pass.expectedFrom)} — {formatDateTime(pass.expectedTo)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Bell className="h-4 w-4" /> Notify at Gate
                  </dt>
                  <dd className="font-medium">{pass.notifyVisitorAtGate ? 'Yes' : 'No'}</dd>
                </div>
              </dl>

              {/* Notes */}
              {pass.notes && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{pass.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Status */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <Card>
            <CardHeader title="Timeline" />
            <CardContent>
              <div className="space-y-3 text-sm">
                <TimelineItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Created"
                  value={formatDateTime(pass.createdAt)}
                  detail={pass.createdByUserName}
                  active
                />
                {pass.approvedAt && (
                  <TimelineItem
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                    label="Approved"
                    value={formatDateTime(pass.approvedAt)}
                    detail={pass.approvedByUserName}
                    active
                  />
                )}
                {pass.checkInAt && (
                  <TimelineItem
                    icon={<LogIn className="h-4 w-4 text-blue-500" />}
                    label="Checked In"
                    value={formatDateTime(pass.checkInAt)}
                    detail={pass.checkInByUserName}
                    active
                  />
                )}
                {pass.checkOutAt && (
                  <TimelineItem
                    icon={<LogOut className="h-4 w-4 text-gray-500" />}
                    label="Checked Out"
                    value={formatDateTime(pass.checkOutAt)}
                    detail={pass.checkOutByUserName}
                    active
                  />
                )}
                {pass.rejectedAt && (
                  <TimelineItem
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                    label="Rejected"
                    value={formatDateTime(pass.rejectedAt)}
                    detail={pass.rejectedByUserName}
                    active
                  />
                )}
                {pass.expiresAt &&
                  (pass.status === VisitorPassStatus.Expired || pass.status === 'Expired') && (
                    <TimelineItem
                      icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
                      label="Expired"
                      value={formatDateTime(pass.expiresAt)}
                      active
                    />
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Rejection Info Card */}
          {pass.rejectedReason && (
            <Card>
              <CardHeader title="Rejection Reason" />
              <CardContent>
                <p className="text-sm text-red-600">{pass.rejectedReason}</p>
                {pass.rejectedByUserName && (
                  <p className="text-xs text-gray-400 mt-2">
                    Rejected by {pass.rejectedByUserName}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Expiry Info */}
          {pass.expiresAt &&
            pass.status !== VisitorPassStatus.Expired &&
            pass.status !== 'Expired' && (
              <Card>
                <CardHeader title="Pass Expiry" />
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Expires: <span className="font-medium">{formatDateTime(pass.expiresAt)}</span>
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Dialogs */}
      <RejectPassDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onSuccess={handleDialogSuccess}
        passId={passId}
      />
      <UpdatePassDialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onSuccess={handleDialogSuccess}
        passId={passId}
        currentData={pass}
      />
    </div>
  );
}

// ============================================
// Timeline Item Component
// ============================================

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string | null;
  active?: boolean;
}

function TimelineItem({ icon, label, value, detail, active }: TimelineItemProps) {
  return (
    <div className={`flex items-center gap-3 ${active ? 'text-gray-900' : 'text-gray-400'}`}>
      <div className={`flex-shrink-0 ${active ? 'text-primary-500' : ''}`}>{icon}</div>
      <div className="flex-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500 ml-2 text-xs">{value}</span>
        {detail && <span className="text-gray-400 ml-1 text-xs">by {detail}</span>}
      </div>
    </div>
  );
}
