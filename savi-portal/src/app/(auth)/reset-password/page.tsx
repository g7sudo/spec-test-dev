'use client';

/**
 * Reset Password Page
 * Sends password reset email via Firebase
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { sendPasswordReset, getFirebaseErrorMessage } from '@/lib/auth';

export default function ResetPasswordPage() {
  // Form state
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const message = getFirebaseErrorMessage(errorCode);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-slide-up shadow-xl">
      {/* Header */}
      <div className="text-center">
        {/* Logo */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-2xl font-bold text-white shadow-lg">
          S
        </div>
        
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Reset password
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send you reset instructions
        </p>
      </div>

      {/* Form */}
      <CardContent className="mt-6">
        {success ? (
          // Success state
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-success/10 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Check your email</p>
                <p className="mt-1 text-green-600">
                  We sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
            </div>
            
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email input */}
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftAddon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
              disabled={isLoading}
            />

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Send reset link
            </Button>

            {/* Back to login */}
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

