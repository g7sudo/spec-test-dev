'use client';

/**
 * Announcement Detail Page
 * View full announcement with images, engagement (likes/comments)
 * Admin can moderate comments, edit, publish, archive
 * Entry point: /tenant/[tenantSlug]/announcements/[id]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Megaphone,
  Loader2,
  ChevronLeft,
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  ExternalLink,
  Pin,
  Users,
  Eye,
  Send,
  Clock,
  Pencil,
  Archive,
  Trash2,
  AlertCircle,
  MoreVertical,
  EyeOff,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getAnnouncementById,
  viewAnnouncement,
  likeAnnouncement,
  unlikeAnnouncement,
  listComments,
  listAllComments,
  addComment,
  deleteComment,
  hideComment,
  unhideComment,
  archiveAnnouncement,
  pinAnnouncement,
  deleteAnnouncement,
} from '@/lib/api/announcements';
import {
  Announcement,
  AnnouncementComment,
  AnnouncementStatus,
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  getCategoryColor,
  getPriorityLabel,
  getPriorityColor,
  formatAnnouncementDateTime,
  formatEventDateRange,
  formatAudienceDisplay,
} from '@/types/announcement';
import { AnnouncementFormDialog, PublishAnnouncementDialog } from '@/components/announcements';

// ============================================
// Main Component
// ============================================

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const announcementId = params.id as string;

  // Refs for Strict Mode guard
  const announcementFetchedRef = useRef(false);
  const commentsFetchedRef = useRef(false);

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_ANNOUNCEMENT_MANAGE'] === true;
  const canView = permissions['TENANT_ANNOUNCEMENT_VIEW'] === true || canManage;

  // Data state
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Engagement state
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // ============================================
  // Data Loading
  // ============================================

  const loadAnnouncement = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && announcementFetchedRef.current) return;
    announcementFetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // Use viewAnnouncement for resident view (marks as read) or getAnnouncementById for admin
      const data = canManage
        ? await getAnnouncementById(announcementId)
        : await viewAnnouncement(announcementId);

      setAnnouncement(data);
      setLikeCount(data.likeCount);
      setHasLiked(data.hasLiked);
    } catch (err) {
      console.error('Failed to load announcement:', err);
      setError('Failed to load announcement');
      announcementFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [canView, canManage, announcementId]);

  const loadComments = useCallback(async (force = false) => {
    if (!announcement) return;
    if (!announcement.allowComments) return;
    if (!force && commentsFetchedRef.current) return;
    commentsFetchedRef.current = true;

    setCommentsLoading(true);

    try {
      // Admin sees all comments including hidden, regular users see only visible
      const result = canManage
        ? await listAllComments(announcementId, { pageSize: 100 })
        : await listComments(announcementId, { pageSize: 100 });

      setComments(result.items);
    } catch (err) {
      console.error('Failed to load comments:', err);
      commentsFetchedRef.current = false;
    } finally {
      setCommentsLoading(false);
    }
  }, [announcement, canManage, announcementId]);

  // Initial load
  useEffect(() => {
    loadAnnouncement();
  }, [loadAnnouncement]);

  // Load comments after announcement is loaded
  useEffect(() => {
    if (announcement && announcement.allowComments) {
      loadComments();
    }
  }, [announcement, loadComments]);

  // ============================================
  // Engagement Actions
  // ============================================

  const handleLikeToggle = async () => {
    if (!announcement || !announcement.allowLikes) return;

    setLikeLoading(true);
    try {
      if (hasLiked) {
        const response = await unlikeAnnouncement(announcementId);
        setLikeCount(response.likeCount);
        setHasLiked(false);
      } else {
        const response = await likeAnnouncement(announcementId);
        setLikeCount(response.likeCount);
        setHasLiked(true);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    try {
      await addComment(announcementId, {
        content: newComment.trim(),
        parentCommentId: replyingTo || undefined,
      });

      setNewComment('');
      setReplyingTo(null);
      commentsFetchedRef.current = false;
      loadComments(true);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(announcementId, commentId);
      commentsFetchedRef.current = false;
      loadComments(true);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleHideComment = async (commentId: string, isHidden: boolean) => {
    try {
      if (isHidden) {
        await unhideComment(announcementId, commentId);
      } else {
        await hideComment(announcementId, commentId);
      }
      commentsFetchedRef.current = false;
      loadComments(true);
    } catch (err) {
      console.error('Failed to toggle comment visibility:', err);
    }
  };

  // ============================================
  // Admin Actions
  // ============================================

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this announcement?')) return;

    setActionLoading(true);
    try {
      await archiveAnnouncement(announcementId);
      announcementFetchedRef.current = false;
      loadAnnouncement(true);
    } catch (err) {
      console.error('Failed to archive:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async () => {
    if (!announcement) return;

    setActionLoading(true);
    try {
      await pinAnnouncement(announcementId, { isPinned: !announcement.isPinned });
      announcementFetchedRef.current = false;
      loadAnnouncement(true);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this announcement? This cannot be undone.')) return;

    setActionLoading(true);
    try {
      await deleteAnnouncement(announcementId);
      router.push(`/tenant/${tenantSlug}/announcements`);
    } catch (err) {
      console.error('Failed to delete:', err);
      setActionLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    announcementFetchedRef.current = false;
    loadAnnouncement(true);
  };

  const handlePublishSuccess = () => {
    setShowPublishDialog(false);
    announcementFetchedRef.current = false;
    loadAnnouncement(true);
  };

  // ============================================
  // Render Comment
  // ============================================

  const renderComment = (comment: AnnouncementComment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-12' : ''} ${comment.isHidden ? 'opacity-50' : ''}`}
    >
      <div className="flex gap-3 py-3">
        <Avatar
          src={comment.author.profileImageUrl}
          name={comment.author.displayName}
          size="sm"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">
              {comment.author.displayName}
            </span>
            {comment.author.isCurrentUser && (
              <span className="text-xs text-primary-600">(You)</span>
            )}
            <span className="text-xs text-gray-400">
              {formatAnnouncementDateTime(comment.createdAt)}
            </span>
            {comment.isHidden && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Hidden
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700">{comment.content}</p>

          {/* Comment Actions */}
          <div className="flex items-center gap-3 mt-2">
            {!isReply && announcement?.allowComments && (
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-primary-600"
                onClick={() => setReplyingTo(comment.id)}
              >
                Reply
              </button>
            )}
            {(comment.author.isCurrentUser || canManage) && (
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-600"
                onClick={() => handleDeleteComment(comment.id)}
              >
                Delete
              </button>
            )}
            {canManage && (
              <button
                type="button"
                className="text-xs text-amber-500 hover:text-amber-600"
                onClick={() => handleHideComment(comment.id, comment.isHidden)}
              >
                {comment.isHidden ? 'Unhide' : 'Hide'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-100">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  // ============================================
  // No permission / Loading / Error states
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Megaphone className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view this announcement.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
        <p className="text-red-600">{error || 'Announcement not found'}</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => router.push(`/tenant/${tenantSlug}/announcements`)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Announcements
        </Button>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => router.push(`/tenant/${tenantSlug}/announcements`)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {canManage && (
          <div className="flex items-center gap-2">
            {/* Edit button - available for Draft, Scheduled, and Published (not Archived) */}
            {announcement.status !== AnnouncementStatus.Archived &&
              announcement.status !== 'Archived' && (
              <Button variant="secondary" onClick={() => setShowEditDialog(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}

            {/* Draft: Show Publish */}
            {(announcement.status === AnnouncementStatus.Draft ||
              announcement.status === 'Draft') && (
              <Button onClick={() => setShowPublishDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}

            {/* Published: Pin/Unpin, Archive */}
            {(announcement.status === AnnouncementStatus.Published ||
              announcement.status === 'Published') && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleTogglePin}
                  disabled={actionLoading}
                >
                  <Pin className="h-4 w-4 mr-2" />
                  {announcement.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleArchive}
                  disabled={actionLoading}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </>
            )}

            {/* Actions Menu - only for Draft (delete option) */}
            {(announcement.status === AnnouncementStatus.Draft ||
              announcement.status === 'Draft') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent className="pt-6">
          {/* Header */}
          <div className="mb-6">
            {/* Status & Meta Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(announcement.status)}`}>
                {getStatusLabel(announcement.status)}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColor(announcement.category)}`}>
                {getCategoryLabel(announcement.category)}
              </span>
              {announcement.priority !== 'Normal' && (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                  {getPriorityLabel(announcement.priority)}
                </span>
              )}
              {announcement.isPinned && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
              {announcement.isBanner && (
                <span className="text-xs text-violet-600">Banner</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {announcement.title}
            </h1>

            {/* Author & Timestamp */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {announcement.author && (
                <div className="flex items-center gap-2">
                  <Avatar
                    src={announcement.author.profileImageUrl}
                    name={announcement.author.displayName}
                    size="sm"
                  />
                  <span>{announcement.author.displayName}</span>
                </div>
              )}
              <span>
                {announcement.publishedAt
                  ? formatAnnouncementDateTime(announcement.publishedAt)
                  : formatAnnouncementDateTime(announcement.createdAt)}
              </span>
            </div>
          </div>

          {/* Images Gallery */}
          {announcement.images && announcement.images.length > 0 && (
            <div className="mb-6">
              {announcement.images.length === 1 ? (
                <img
                  src={announcement.images[0].url}
                  alt={announcement.images[0].fileName || 'Announcement image'}
                  className="w-full rounded-xl object-cover max-h-96 cursor-pointer"
                  onClick={() => setSelectedImageIndex(0)}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {announcement.images.map((image, index) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.fileName || `Image ${index + 1}`}
                      className="w-full h-40 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Body Content */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="whitespace-pre-wrap text-gray-700">{announcement.body}</p>
          </div>

          {/* Event Details */}
          {announcement.isEvent && (
            <div className="bg-violet-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-violet-700">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatEventDateRange(
                      announcement.eventStartAt,
                      announcement.eventEndAt,
                      announcement.isAllDay
                    )}
                  </span>
                </div>
                {announcement.eventLocationText && (
                  <div className="flex items-center gap-2 text-violet-700">
                    <MapPin className="h-4 w-4" />
                    <span>{announcement.eventLocationText}</span>
                  </div>
                )}
                {announcement.eventJoinUrl && (
                  <a
                    href={announcement.eventJoinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-violet-600 hover:text-violet-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Join Virtual Event</span>
                  </a>
                )}
                {announcement.allowAddToCalendar && (
                  <Button variant="secondary" size="sm" className="mt-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Audience Info (Admin only) */}
          {canManage && announcement.audiences && announcement.audiences.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience
              </h3>
              <div className="flex flex-wrap gap-2">
                {announcement.audiences.map((audience) => (
                  <span
                    key={audience.id}
                    className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border"
                  >
                    {formatAudienceDisplay(audience)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats (Admin only) */}
          {canManage && (
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pt-4 border-t">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {announcement.readCount} reads
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {announcement.likeCount} likes
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {announcement.commentCount} comments
              </span>
            </div>
          )}

          {/* Engagement Actions */}
          {(announcement.status === AnnouncementStatus.Published ||
            announcement.status === 'Published') && (
            <div className="flex items-center gap-4 pt-4 border-t">
              {announcement.allowLikes && (
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  disabled={likeLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    hasLiked
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>
              )}

              {announcement.allowComments && (
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length} comments</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      {announcement.allowComments && (
        <Card>
          <CardHeader title="Comments" />
          <CardContent>
            {/* Comment Form */}
            <div className="mb-6">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <span>Replying to comment</span>
                  <button
                    type="button"
                    className="text-primary-600 hover:underline"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <Avatar size="sm" />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentSubmitting}
                    >
                      {commentSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="divide-y">
                {comments.map((comment) => renderComment(comment))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Lightbox */}
      {selectedImageIndex !== null && announcement.images && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImageIndex(null)}
          >
            ✕
          </button>
          <img
            src={announcement.images[selectedImageIndex].url}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {announcement.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {announcement.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <AnnouncementFormDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={handleEditSuccess}
          announcementId={announcementId}
        />
      )}

      {/* Publish Dialog */}
      {showPublishDialog && (
        <PublishAnnouncementDialog
          open={showPublishDialog}
          onClose={() => setShowPublishDialog(false)}
          onSuccess={handlePublishSuccess}
          announcementId={announcementId}
          announcementTitle={announcement.title}
        />
      )}
    </div>
  );
}

