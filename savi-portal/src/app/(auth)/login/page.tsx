'use client';

/**
 * Login Page
 * Firebase authentication with email/password
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { signInWithEmail, getFirebaseErrorMessage, fetchAuthMe } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { getDefaultLandingRoute } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { status, profile } = useAuthStore();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && profile) {
      const landingRoute = getDefaultLandingRoute(profile);
      router.replace(landingRoute);
    }
  }, [status, profile, router]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Sign in with Firebase
      await signInWithEmail(email, password);
      
      // Firebase auth state change will trigger the AuthProvider
      // to fetch /auth/me and update the store
      // The useEffect above will then redirect
      
    } catch (err: any) {
      // Handle Firebase errors
      const errorCode = err?.code || '';
      const message = getFirebaseErrorMessage(errorCode);
      setError(message);
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
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign in to your SAVI account
        </p>
      </div>

      {/* Form */}
      <CardContent className="mt-6">
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

          {/* Password input */}
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftAddon={<Lock className="h-4 w-4" />}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />

          {/* Forgot password link */}
          <div className="flex justify-end">
            <Link
              href="/reset-password"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </form>
      </CardContent>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <span className="text-gray-600">Contact your administrator</span>
      </div>
    </Card>
  );
}

