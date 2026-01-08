'use client';

/**
 * Maintenance Request Detail Page
 * Shows full request details, workflow actions, details, comments, and approval status
 * Entry point: /tenant/[tenantSlug]/maintenance/[requestId]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Wrench,
  Home,
  User,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  UserPlus,
  UserMinus,
  ClipboardCheck,
  Plus,
  Trash2,
  MessageSquare,
  DollarSign,
  Star,
  Edit,
  Ban,
  Send,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getMaintenanceRequestById,
  listMaintenanceRequestDetails,
  listMaintenanceComments,
  getMaintenanceApproval,
  deleteMaintenanceRequestDetail,
  deleteMaintenanceComment,
  startMaintenanceRequest,
  completeMaintenanceRequest,
  unassignMaintenanceRequest,
  approveMaintenanceRequest,
} from '@/lib/api/maintenance';
import {
  MaintenanceRequest,
  MaintenanceRequestDetail,
  MaintenanceComment,
  MaintenanceApproval,
  MaintenanceStatus,
  getMaintenanceStatusLabel,
  getMaintenanceStatusColor,
  getMaintenancePriorityLabel,
  getMaintenancePriorityColor,
  getMaintenanceSourceLabel,
  getDetailTypeLabel,
  getApprovalStatusLabel,
  getApprovalStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getCommentTypeLabel,
  formatDateTime,
  formatCurrency,
  MaintenanceApprovalStatus,
  MaintenanceOwnerPaymentStatus,
} from '@/types/maintenance';
import {
  AssignRequestDialog,
  AssessmentDialog,
  DetailLineDialog,
  RequestApprovalDialog,
  AddCommentDialog,
  RejectDialog,
  CancelDialog,
  RecordPaymentDialog,
} from '@/components/maintenance';

// ============================================
// Main Component
// ============================================

export default function MaintenanceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const requestId = params.requestId as string;

  // Refs for Strict Mode guard
  const requestFetchedRef = useRef(false);
  const detailsFetchedRef = useRef(false);
  const commentsFetchedRef = useRef(false);
  const approvalFetchedRef = useRef(false);

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_MAINTENANCE_REQUEST_VIEW'] === true;
  const canManage = permissions['TENANT_MAINTENANCE_REQUEST_MANAGE'] === true;

  // Data state
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [details, setDetails] = useState<MaintenanceRequestDetail[]>([]);
  const [comments, setComments] = useState<MaintenanceComment[]>([]);
  const [approval, setApproval] = useState<MaintenanceApproval | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action loading states
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState<MaintenanceRequestDetail | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectType, setRejectType] = useState<'request' | 'approval'>('request');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // ============================================
  // Data Loading
  // ============================================

  const loadRequest = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && requestFetchedRef.current) return;
    requestFetchedRef.current = true;

    try {
      const data = await getMaintenanceRequestById(requestId);
      setRequest(data);
    } catch (err) {
      console.error('Failed to load request:', err);
      setError('Failed to load maintenance request');
      requestFetchedRef.current = false;
    }
  }, [canView, requestId]);

  const loadDetails = useCallback(async (force = false) => {
    if (!force && detailsFetchedRef.current) return;
    detailsFetchedRef.current = true;

    try {
      const data = await listMaintenanceRequestDetails(requestId);
      setDetails(data);
    } catch (err) {
      console.error('Failed to load details:', err);
      detailsFetchedRef.current = false;
    }
  }, [requestId]);

  const loadComments = useCallback(async (force = false) => {
    if (!force && commentsFetchedRef.current) return;
    commentsFetchedRef.current = true;

    try {
      const data = await listMaintenanceComments(requestId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
      commentsFetchedRef.current = false;
    }
  }, [requestId]);

  const loadApproval = useCallback(async (force = false) => {
    if (!force && approvalFetchedRef.current) return;
    approvalFetchedRef.current = true;

    try {
      const data = await getMaintenanceApproval(requestId);
      setApproval(data);
    } catch (err) {
      console.error('Failed to load approval:', err);
      approvalFetchedRef.current = false;
    }
  }, [requestId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadRequest(), loadDetails(), loadComments(), loadApproval()]).finally(() => {
      setIsLoading(false);
    });
  }, [loadRequest, loadDetails, loadComments, loadApproval]);

  // Refresh all data
  const refreshAll = useCallback(() => {
    requestFetchedRef.current = false;
    detailsFetchedRef.current = false;
    commentsFetchedRef.current = false;
    approvalFetchedRef.current = false;
    Promise.all([loadRequest(true), loadDetails(true), loadComments(true), loadApproval(true)]);
  }, [loadRequest, loadDetails, loadComments, loadApproval]);

  // ============================================
  // Workflow Actions
  // ============================================

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await startMaintenanceRequest(requestId);
      refreshAll();
    } catch (err) {
      console.error('Failed to start:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsActionLoading(true);
    try {
      await completeMaintenanceRequest(requestId);
      refreshAll();
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsActionLoading(true);
    try {
      await unassignMaintenanceRequest(requestId);
      refreshAll();
    } catch (err) {
      console.error('Failed to unassign:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOwnerApprove = async () => {
    setIsActionLoading(true);
    try {
      await approveMaintenanceRequest(requestId);
      refreshAll();
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete detail
  const handleDeleteDetail = async (detailId: string) => {
    if (!confirm('Delete this line item?')) return;
    try {
      await deleteMaintenanceRequestDetail(requestId, detailId);
      detailsFetchedRef.current = false;
      loadDetails(true);
    } catch (err) {
      console.error('Failed to delete detail:', err);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteMaintenanceComment(requestId, commentId);
      commentsFetchedRef.current = false;
      loadComments(true);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // ============================================
  // Dialog Success Handlers
  // ============================================

  const handleDialogSuccess = () => {
    setShowAssignDialog(false);
    setShowAssessmentDialog(false);
    setShowDetailDialog(false);
    setEditingDetail(null);
    setShowApprovalDialog(false);
    setShowCommentDialog(false);
    setShowRejectDialog(false);
    setShowCancelDialog(false);
    setShowPaymentDialog(false);
    refreshAll();
  };

  // ============================================
  // Calculate totals
  // ============================================

  const totalEstimated = details.reduce(
    (sum, d) => sum + (d.estimatedTotalPrice || d.quantity * (d.estimatedUnitPrice || 0) || 0),
    0
  );

  // ============================================
  // Determine available actions based on status
  // ============================================

  const status = request?.status;
  const canAssign = canManage && (status === MaintenanceStatus.New || status === 'New');
  const canUnassign = canManage && request?.assignedToUserId && (status === MaintenanceStatus.Assigned || status === 'Assigned');
  const canStart = canManage && (status === MaintenanceStatus.Assigned || status === 'Assigned');
  const canSubmitAssessment = canManage && (status === MaintenanceStatus.InProgress || status === 'InProgress');
  const canRequestApproval = canManage && (status === MaintenanceStatus.InProgress || status === 'InProgress') && !approval;
  const canComplete = canManage && (status === MaintenanceStatus.InProgress || status === 'InProgress');
  const canReject = canManage && (status === MaintenanceStatus.New || status === 'New' || status === MaintenanceStatus.Assigned || status === 'Assigned');
  const canCancel = canManage && ![MaintenanceStatus.Completed, 'Completed', MaintenanceStatus.Cancelled, 'Cancelled', MaintenanceStatus.Rejected, 'Rejected'].includes(status as MaintenanceStatus);
  
  // Approval-specific actions
  const approvalPending = approval?.status === MaintenanceApprovalStatus.Pending || approval?.status === 'Pending';
  const approvalApproved = approval?.status === MaintenanceApprovalStatus.Approved || approval?.status === 'Approved';
  const paymentPending = approval?.ownerPaymentStatus === MaintenanceOwnerPaymentStatus.Pending || approval?.ownerPaymentStatus === 'Pending';
  const canOwnerApprove = canManage && approvalPending;
  const canRejectApproval = canManage && approvalPending;
  const canRecordPayment = canManage && approvalApproved && paymentPending;

  // ============================================
  // Loading & Error States
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Wrench className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view this request.</p>
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

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error || 'Request not found'}</p>
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
            onClick={() => router.push(`/tenant/${tenantSlug}/maintenance`)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Maintenance
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {request.ticketNumber}
            </h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getMaintenanceStatusColor(request.status)}`}>
              {getMaintenanceStatusLabel(request.status)}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getMaintenancePriorityColor(request.priority)}`}>
              {getMaintenancePriorityLabel(request.priority)}
            </span>
          </div>
          <h2 className="text-lg text-gray-600 mt-1">{request.title}</h2>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canAssign && (
            <Button onClick={() => setShowAssignDialog(true)} disabled={isActionLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}
          {canUnassign && (
            <Button variant="secondary" onClick={handleUnassign} disabled={isActionLoading}>
              <UserMinus className="h-4 w-4 mr-2" />
              Unassign
            </Button>
          )}
          {canStart && (
            <Button onClick={handleStart} disabled={isActionLoading}>
              <Play className="h-4 w-4 mr-2" />
              Start Work
            </Button>
          )}
          {canComplete && (
            <Button onClick={handleComplete} disabled={isActionLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
          {canReject && (
            <Button variant="danger" onClick={() => { setRejectType('request'); setShowRejectDialog(true); }} disabled={isActionLoading}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          {canCancel && (
            <Button variant="secondary" onClick={() => setShowCancelDialog(true)} disabled={isActionLoading}>
              <Ban className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Request Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader title="Request Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Home className="h-4 w-4" /> Unit
                  </dt>
                  <dd className="font-medium">{request.unitNumber || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Tag className="h-4 w-4" /> Category
                  </dt>
                  <dd className="font-medium">{request.categoryName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" /> Requested For
                  </dt>
                  <dd className="font-medium">{request.requestedForPartyName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" /> Requested By
                  </dt>
                  <dd className="font-medium">{request.requestedByUserName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Requested At
                  </dt>
                  <dd className="font-medium">{formatDateTime(request.requestedAt)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd className="font-medium">{getMaintenanceSourceLabel(request.source)}</dd>
                </div>
                {request.assignedToUserName && (
                  <div>
                    <dt className="text-gray-500">Assigned To</dt>
                    <dd className="font-medium">{request.assignedToUserName}</dd>
                  </div>
                )}
                {request.dueBy && (
                  <div>
                    <dt className="text-gray-500">Due By</dt>
                    <dd className="font-medium">{formatDateTime(request.dueBy)}</dd>
                  </div>
                )}
              </dl>

              {/* Description */}
              {request.description && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Card */}
          <Card>
            <CardHeader
              title="Site Assessment"
              action={
                canSubmitAssessment && (
                  <Button size="sm" variant="secondary" onClick={() => setShowAssessmentDialog(true)}>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {request.assessmentSummary ? 'Update' : 'Submit'} Assessment
                  </Button>
                )
              }
            />
            <CardContent>
              {request.assessmentSummary ? (
                <div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.assessmentSummary}</p>
                  {request.assessmentCompletedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Completed: {formatDateTime(request.assessmentCompletedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No assessment submitted yet</p>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Details & Comments */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">
                Line Items ({details.length})
              </TabsTrigger>
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
            </TabsList>

            {/* Detail Lines Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader
                  title="Service & Parts"
                  description={totalEstimated > 0 ? `Total: ${formatCurrency(totalEstimated)}` : undefined}
                  action={
                    canManage && (
                      <Button size="sm" onClick={() => { setEditingDetail(null); setShowDetailDialog(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    )
                  }
                />
                <CardContent>
                  {details.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      No line items added yet
                    </p>
                  ) : (
                    <div className="divide-y">
                      {details.map((detail) => (
                        <div key={detail.id} className="py-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                detail.lineType === 'Service' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {getDetailTypeLabel(detail.lineType)}
                              </span>
                              <span className="font-medium text-sm">{detail.description}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {detail.quantity} {detail.unitOfMeasure || 'units'}
                              {detail.estimatedUnitPrice && ` × ${formatCurrency(detail.estimatedUnitPrice)}`}
                              {!detail.isBillable && <span className="ml-2 text-gray-400">(Non-billable)</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {formatCurrency(detail.estimatedTotalPrice || detail.quantity * (detail.estimatedUnitPrice || 0))}
                            </span>
                            {canManage && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => { setEditingDetail(detail); setShowDetailDialog(true); }}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDeleteDetail(detail.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card>
                <CardHeader
                  title="Comments & Notes"
                  action={
                    canManage && (
                      <Button size="sm" onClick={() => setShowCommentDialog(true)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                      </Button>
                    )
                  }
                />
                <CardContent>
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      No comments yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                                {getCommentTypeLabel(comment.commentType)}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {comment.createdByName} • {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            {canManage && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                            {comment.message}
                          </p>
                          
                          {/* Comment Attachments */}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {comment.attachments.map((attachment) => (
                                <a
                                  key={attachment.documentId}
                                  href={attachment.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-colors"
                                >
                                  <img
                                    src={attachment.downloadUrl}
                                    alt={attachment.fileName}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs">
                                      View
                                    </span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-1">
                            {comment.isVisibleToResident && <span className="mr-2">👤 Resident</span>}
                            {comment.isVisibleToOwner && <span>🏠 Owner</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Status & Approval */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <Card>
            <CardHeader title="Timeline" />
            <CardContent>
              <div className="space-y-3 text-sm">
                <TimelineItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Requested"
                  value={formatDateTime(request.requestedAt)}
                  active
                />
                {request.assignedAt && (
                  <TimelineItem
                    icon={<UserPlus className="h-4 w-4" />}
                    label="Assigned"
                    value={formatDateTime(request.assignedAt)}
                    active
                  />
                )}
                {request.startedAt && (
                  <TimelineItem
                    icon={<Play className="h-4 w-4" />}
                    label="Started"
                    value={formatDateTime(request.startedAt)}
                    active
                  />
                )}
                {request.assessmentCompletedAt && (
                  <TimelineItem
                    icon={<ClipboardCheck className="h-4 w-4" />}
                    label="Assessment"
                    value={formatDateTime(request.assessmentCompletedAt)}
                    active
                  />
                )}
                {request.completedAt && (
                  <TimelineItem
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                    label="Completed"
                    value={formatDateTime(request.completedAt)}
                    active
                  />
                )}
                {request.rejectedAt && (
                  <TimelineItem
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                    label="Rejected"
                    value={formatDateTime(request.rejectedAt)}
                    active
                  />
                )}
                {request.cancelledAt && (
                  <TimelineItem
                    icon={<Ban className="h-4 w-4 text-gray-500" />}
                    label="Cancelled"
                    value={formatDateTime(request.cancelledAt)}
                    active
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Approval Card */}
          <Card>
            <CardHeader
              title="Owner Approval"
              action={
                canRequestApproval && (
                  <Button size="sm" onClick={() => setShowApprovalDialog(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Request
                  </Button>
                )
              }
            />
            <CardContent>
              {approval ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getApprovalStatusColor(approval.status)}`}>
                      {getApprovalStatusLabel(approval.status)}
                    </span>
                  </div>
                  {approval.requestedAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Amount</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(approval.requestedAmount, approval.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Payment</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getPaymentStatusColor(approval.ownerPaymentStatus)}`}>
                      {getPaymentStatusLabel(approval.ownerPaymentStatus)}
                    </span>
                  </div>
                  {approval.ownerPaidAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Paid</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(approval.ownerPaidAmount)}
                      </span>
                    </div>
                  )}

                  {/* Approval Actions */}
                  <div className="pt-3 border-t flex flex-wrap gap-2">
                    {canOwnerApprove && (
                      <Button size="sm" onClick={handleOwnerApprove} disabled={isActionLoading}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {canRejectApproval && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => { setRejectType('approval'); setShowRejectDialog(true); }}
                        disabled={isActionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    {canRecordPayment && (
                      <Button size="sm" variant="secondary" onClick={() => setShowPaymentDialog(true)} disabled={isActionLoading}>
                        <CreditCard className="h-4 w-4 mr-1" />
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No approval requested yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rating Card */}
          {(request.status === MaintenanceStatus.Completed || request.status === 'Completed') && (
            <Card>
              <CardHeader title="Resident Feedback" />
              <CardContent>
                {request.residentRating ? (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= request.residentRating!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium">
                        {request.residentRating}/5
                      </span>
                    </div>
                    {request.residentFeedback && (
                      <p className="text-sm text-gray-600 italic">
                        &quot;{request.residentFeedback}&quot;
                      </p>
                    )}
                    {request.ratedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Rated on {formatDateTime(request.ratedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Awaiting resident feedback
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejection/Cancellation Info */}
          {request.rejectionReason && (
            <Card>
              <CardHeader title="Rejection Reason" />
              <CardContent>
                <p className="text-sm text-red-600">{request.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
          {request.cancellationReason && (
            <Card>
              <CardHeader title="Cancellation Reason" />
              <CardContent>
                <p className="text-sm text-gray-600">{request.cancellationReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AssignRequestDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
        currentAssigneeId={request.assignedToUserId}
      />
      <AssessmentDialog
        open={showAssessmentDialog}
        onClose={() => setShowAssessmentDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
        currentAssessment={request.assessmentSummary}
      />
      <DetailLineDialog
        open={showDetailDialog}
        onClose={() => { setShowDetailDialog(false); setEditingDetail(null); }}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
        detail={editingDetail}
      />
      <RequestApprovalDialog
        open={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
        suggestedAmount={totalEstimated || null}
      />
      <AddCommentDialog
        open={showCommentDialog}
        onClose={() => setShowCommentDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
      />
      <RejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
        type={rejectType}
      />
      <CancelDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
      />
      <RecordPaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onSuccess={handleDialogSuccess}
        requestId={requestId}
        approvedAmount={approval?.requestedAmount}
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
  active?: boolean;
}

function TimelineItem({ icon, label, value, active }: TimelineItemProps) {
  return (
    <div className={`flex items-center gap-3 ${active ? 'text-gray-900' : 'text-gray-400'}`}>
      <div className={`flex-shrink-0 ${active ? 'text-primary-500' : ''}`}>{icon}</div>
      <div className="flex-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500 ml-2 text-xs">{value}</span>
      </div>
    </div>
  );
}

