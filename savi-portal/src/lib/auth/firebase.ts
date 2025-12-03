/**
 * Firebase Authentication setup and utilities
 * Client-side Firebase initialization
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Auth,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { firebaseConfig } from '@/config/env';

// ============================================
// Firebase Initialization
// ============================================

let app: FirebaseApp;
let auth: Auth;

/**
 * Gets or initializes the Firebase app
 * Safe to call multiple times (singleton pattern)
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    // Check if already initialized (for hot reload)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

/**
 * Gets the Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// ============================================
// Auth Functions
// ============================================

/**
 * Signs in with email and password
 * @returns Firebase User on success
 * @throws FirebaseError on failure
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Creates a new user with email and password
 * Used for invitation acceptance when user doesn't have an account
 * @returns Firebase User on success
 * @throws FirebaseError on failure
 */
export async function createUserWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Sends a password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

/**
 * Gets the current ID token for API calls
 * @param forceRefresh - Force refresh even if not expired
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

/**
 * Subscribes to auth state changes
 * @returns Unsubscribe function
 */
export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * Gets the current Firebase user (sync)
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

// ============================================
// Error Helpers
// ============================================

/**
 * Maps Firebase error codes to user-friendly messages
 */
export function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password should be at least 6 characters.',
  };
  
  return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

