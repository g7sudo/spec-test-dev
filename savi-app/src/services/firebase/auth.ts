/**
 * Firebase Authentication Helpers
 * 
 * Provides helper functions for Firebase authentication operations.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User,
  AuthError,
  FirebaseError,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebaseApp';

/**
 * Creates a new user account with email and password
 * 
 * @param email - User email address
 * @param password - User password (minimum 6 characters)
 * @returns Firebase User object
 * @throws FirebaseError if sign up fails
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<User> {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    // Re-throw Firebase errors with better context
    if (error instanceof FirebaseError) {
      throw new Error(getFirebaseErrorMessage(error));
    }
    throw error;
  }
}

/**
 * Signs in an existing user with email and password
 * 
 * @param email - User email address
 * @param password - User password
 * @returns Firebase User object
 * @throws FirebaseError if sign in fails
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    // Re-throw Firebase errors with better context
    if (error instanceof FirebaseError) {
      throw new Error(getFirebaseErrorMessage(error));
    }
    throw error;
  }
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
 * 
 * @param email - User email address
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(getFirebaseErrorMessage(error));
    }
    throw error;
  }
}

/**
 * Gets the Firebase ID token for the current user
 * 
 * @param forceRefresh - Whether to force refresh the token
 * @returns Firebase ID token
 * @throws Error if user is not authenticated
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  return await user.getIdToken(forceRefresh);
}

/**
 * Converts Firebase error codes to user-friendly messages
 */
function getFirebaseErrorMessage(error: FirebaseError): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please try again.';
    case 'auth/invalid-verification-id':
      return 'Invalid verification ID. Please try again.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

