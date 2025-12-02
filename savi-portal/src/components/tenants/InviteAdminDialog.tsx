'use client';

/**
 * Invite Admin Dialog
 * Invite a community admin for a tenant
 */

import { useState } from 'react';
import { UserPlus, Mail, User, Copy, Check, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inviteTenantAdmin } from '@/lib/api/tenants';
import { TenantSummary, Tenant, InviteAdminResponse } from '@/types/tenant';

// ============================================
// Props
// ============================================

interface InviteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantSummary | Tenant;
  onSuccess?: () => void;
}

// ============================================
// Component
// ============================================

export function InviteAdminDialog({
  open,
  onOpenChange,
  tenant,
  onSuccess,
}: InviteAdminDialogProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<InviteAdminResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setEmail('');
      setFullName('');
      setError(null);
      setInviteResult(null);
      setCopied(false);
    }
    onOpenChange(newOpen);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    try {
      const result = await inviteTenantAdmin(tenant.id, {
        email,
        fullName: fullName || null,
      });
      
      setInviteResult(result);
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to send invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  // Copy invitation URL to clipboard
  const handleCopyUrl = async () => {
    if (inviteResult?.invitationUrl) {
      await navigator.clipboard.writeText(inviteResult.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Success view after invitation sent
  if (inviteResult) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="mt-4">Invitation Sent!</DialogTitle>
            <DialogDescription className="mt-2">
              An invitation has been sent to <strong>{inviteResult.inviteeEmail}</strong> to 
              become an admin of <strong>{inviteResult.tenantName}</strong>.
            </DialogDescription>
          </div>

          <div className="mt-6 space-y-4">
            {/* Invitation details */}
            <div className="rounded-lg bg-surface-50 p-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className="font-medium">{inviteResult.tenantRoleCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires:</span>
                  <span className="font-medium">
                    {new Date(inviteResult.invitationExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Invitation URL (dev only) */}
            {inviteResult.invitationUrl && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Invitation Link (Dev Only)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={inviteResult.invitationUrl}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Form view
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary-600" />
          Invite Community Admin
        </DialogTitle>
        <DialogDescription>
          Invite an administrator for <strong>{tenant.name}</strong>. 
          They will receive an email with instructions to join.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            leftAddon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            leftAddon={<User className="h-4 w-4" />}
            hint="Optional - helps personalize the invitation"
          />

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSending}>
              <UserPlus className="h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

