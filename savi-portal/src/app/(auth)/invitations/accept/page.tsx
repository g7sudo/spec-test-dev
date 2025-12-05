'use client';

/**
 * Accept Invitation Page
 * Handles tenant admin invitation acceptance flow:
 * 1. Validate token (anonymous)
 * 2. Show invitation details with locked email
 * 3. User signs in with Firebase
 * 4. Accept invitation (authenticated)
 * 5. Redirect to tenant dashboard
 */

import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Shield,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { validateInvitation, acceptInvitation } from '@/lib/api/invitations';
import { signInWithEmail, createUserWithEmail, getFirebaseErrorMessage } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { useScopeStore } from '@/lib/store/scope-store';
import { fetchAuthMe } from '@/lib/auth';
import {
  ValidateInvitationResponse,
  getRoleLabel,
  formatExpirationDate,
} from '@/types/invitation';

// ============================================
// Step type
// ============================================

type Step = 'loading' | 'invalid' | 'details' | 'signin' | 'accepting' | 'success';

// ============================================
// Component
// ============================================

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { status: authStatus } = useAuthStore();
  const { setTenantScope } = useScopeStore();
  
  // Prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  // State
  const [step, setStep] = useState<Step>('loading');
  const [invitation, setInvitation] = useState<ValidateInvitationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Sign-in form state
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================
  // Validate invitation on mount
  // ============================================

  const validateToken = useCallback(async () => {
    if (!token) {
      setError('No invitation token provided');
      setStep('invalid');
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      const data = await validateInvitation(token);
      setInvitation(data);
      setStep('details');
    } catch (err: any) {
      console.error('Failed to validate invitation:', err);
      setError(err.message || 'Invalid or expired invitation');
      setStep('invalid');
      fetchedRef.current = false;
    }
  }, [token]);

  useEffect(() => {
    fetchedRef.current = false;
    validateToken();
  }, [validateToken]);

  // ============================================
  // Handle sign in / sign up
  // ============================================

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!invitation || !token) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (isNewUser) {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsSubmitting(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        
        // Create new account
        await createUserWithEmail(invitation.inviteeEmail, password);
      } else {
        // Sign in existing user
        await signInWithEmail(invitation.inviteeEmail, password);
      }

      // Now accept the invitation
      setStep('accepting');
      const result = await acceptInvitation(token);

      // Set tenant scope for API calls
      setTenantScope(result.tenantId, result.tenantCode);

      // Refresh auth profile to get new tenant membership
      await fetchAuthMe();

      // Show success briefly then redirect
      setStep('success');
      
      setTimeout(() => {
        // Always redirect to tenant dashboard
        router.push(`/tenant/${result.tenantCode}/dashboard`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      
      // Handle Firebase-specific errors
      const errorCode = err?.code || '';
      if (errorCode) {
        setError(getFirebaseErrorMessage(errorCode));
      } else {
        setError(err.message || 'Failed to complete sign in');
      }
      
      setStep('signin');
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render based on step
  // ============================================

  // Loading state
  if (step === 'loading') {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="mt-4 text-gray-500">Validating invitation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Invalid/expired invitation
  if (step === 'invalid') {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
              <AlertCircle className="h-6 w-6 text-error" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Welcome to {invitation?.tenantName}!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Redirecting you to your dashboard...
            </p>
            <Loader2 className="mt-4 h-5 w-5 animate-spin text-primary-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Accepting state
  if (step === 'accepting') {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="mt-4 text-gray-500">Setting up your access...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Details / Sign-in form
  return (
    <Card className="shadow-xl">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <Building2 className="h-7 w-7" />
        </div>
        
        <h1 className="font-display text-2xl font-bold text-gray-900">
          You&apos;re Invited!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Join {invitation?.tenantName} as a {getRoleLabel(invitation?.tenantRoleCode || '')}
        </p>
      </div>

      <CardContent className="mt-6 space-y-6">
        {/* Invitation Details */}
        {step === 'details' && (
          <>
            <div className="rounded-lg bg-surface-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Community</p>
                  <p className="font-medium text-gray-900">{invitation?.tenantName}</p>
                </div>
              </div>
              
              {invitation?.tenantCity && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                    <p className="font-medium text-gray-900">{invitation.tenantCity}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Your Role</p>
                  <p className="font-medium text-gray-900">
                    {getRoleLabel(invitation?.tenantRoleCode || '')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Invitation</p>
                  <p className="font-medium text-gray-900">
                    {formatExpirationDate(invitation?.invitationExpiresAt || '')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
              <p className="text-sm text-primary-700">
                <strong>Continue with:</strong> {invitation?.inviteeEmail}
              </p>
              <p className="mt-1 text-xs text-primary-600">
                You must sign in with this email address to accept the invitation.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep('signin')}
            >
              Continue
            </Button>
          </>
        )}

        {/* Sign-in Form */}
        {step === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email (locked) */}
            <Input
              type="email"
              label="Email address"
              value={invitation?.inviteeEmail || ''}
              leftAddon={<Mail className="h-4 w-4" />}
              disabled
              hint="Email is locked to match your invitation"
            />

            {/* Toggle for new/existing user */}
            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                id="isNewUser"
                checked={isNewUser}
                onChange={(e) => setIsNewUser(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isNewUser" className="text-gray-700">
                I don&apos;t have an account yet
              </label>
            </div>

            {/* Password */}
            <Input
              type="password"
              label={isNewUser ? 'Create Password' : 'Password'}
              placeholder={isNewUser ? 'Create a strong password' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftAddon={<Lock className="h-4 w-4" />}
              required
              autoComplete={isNewUser ? 'new-password' : 'current-password'}
              disabled={isSubmitting}
            />

            {/* Confirm password (new users only) */}
            {isNewUser && (
              <Input
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftAddon={<Lock className="h-4 w-4" />}
                required
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              {isNewUser ? 'Create Account & Join' : 'Sign In & Join'}
            </Button>

            {/* Back button */}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('details');
                setError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isSubmitting}
            >
              Back
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
