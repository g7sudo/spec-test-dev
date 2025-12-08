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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
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
  } catch (error: any) {
    // Re-throw Firebase errors with better context
    const isFirebaseError = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('auth/');
    if (isFirebaseError) {
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
  } catch (error: any) {
    // Re-throw Firebase errors with better context
    const isFirebaseError = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('auth/');
    if (isFirebaseError) {
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
  } catch (error: any) {
    const isFirebaseError = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('auth/');
    if (isFirebaseError) {
      throw new Error(getFirebaseErrorMessage(error));
    }
    throw error;
  }
}

/**
 * Waits for Firebase Auth to restore user from persistence
 * 
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 5000ms)
 * @returns Promise that resolves when user is available or rejects on timeout
 */
function waitForAuthRestore(timeoutMs: number = 5000): Promise<User> {
  return new Promise((resolve, reject) => {
    const auth = getFirebaseAuth();
    
    console.log('[Firebase Auth] 🔍 Checking auth state...', {
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
      } : null,
      timestamp: new Date().toISOString(),
    });
    
    // If user is already available, resolve immediately
    if (auth.currentUser) {
      console.log('[Firebase Auth] ✅ User already available, no wait needed');
      resolve(auth.currentUser);
      return;
    }
    
    console.log('[Firebase Auth] ⏳ User not available, waiting for auth state restoration...');
    
    // Set up timeout
    const timeout = setTimeout(() => {
      console.error('[Firebase Auth] ⏱️ Auth state restoration timeout after', timeoutMs, 'ms');
      unsubscribe();
      reject(new Error('Authentication state restore timeout. Please try signing out and signing in again.'));
    }, timeoutMs);
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('[Firebase Auth] 📡 Auth state changed:', {
          hasUser: !!user,
          userId: user?.uid,
          email: user?.email,
          timestamp: new Date().toISOString(),
        });
        
        if (user) {
          console.log('[Firebase Auth] ✅ User restored from persistence');
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        }
      },
      (error) => {
        console.error('[Firebase Auth] ❌ Auth state change error:', {
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
        });
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    );
  });
}

/**
 * Changes the password for the current user
 * 
 * Requires re-authentication before changing password (Firebase security requirement).
 * 
 * @param currentPassword - Current password for re-authentication
 * @param newPassword - New password (minimum 6 characters)
 * @returns Updated User object
 * @throws FirebaseError if password change fails
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<User> {
  console.log('[Firebase Auth] 🔐 CHANGE PASSWORD REQUEST START:', {
    hasCurrentPassword: !!currentPassword,
    currentPasswordLength: currentPassword.length,
    hasNewPassword: !!newPassword,
    newPasswordLength: newPassword.length,
    timestamp: new Date().toISOString(),
  });
  
  const auth = getFirebaseAuth();
  
  // Check auth store to see if user is logged in via app
  // This helps diagnose if Firebase Auth persistence isn't working
  const { useAuthStore } = await import('@/state/authStore');
  const authStoreUser = useAuthStore.getState().user;
  const authStoreToken = useAuthStore.getState().idToken;
  
  console.log('[Firebase Auth] 🔍 Checking auth state:', {
    firebaseCurrentUser: auth.currentUser ? {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
    } : null,
    authStoreUser: authStoreUser ? {
      uid: authStoreUser.uid,
      email: authStoreUser.email,
    } : null,
    hasAuthStoreToken: !!authStoreToken,
    timestamp: new Date().toISOString(),
  });
  
  // Wait for Firebase Auth to restore user from AsyncStorage persistence
  // This is necessary because auth state restoration is asynchronous
  let user: User;
  try {
    console.log('[Firebase Auth] ⏳ Step 1: Waiting for auth state restoration...');
    user = await waitForAuthRestore(5000);
    console.log('[Firebase Auth] ✅ Step 1: Auth state restored, user available:', {
      userId: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providerId: user.providerId,
    });
  } catch (error: any) {
    console.error('[Firebase Auth] ❌ Step 1 FAILED: Failed to restore auth state:', {
      error: error.message,
      errorType: typeof error,
      authStoreHasUser: !!authStoreUser,
      authStoreHasToken: !!authStoreToken,
      timestamp: new Date().toISOString(),
    });
    
    // Provide helpful error message based on auth store state
    if (authStoreUser && authStoreToken) {
      throw new Error(
        'Firebase authentication state was not restored. ' +
        'This may happen if you logged in before authentication persistence was enabled. ' +
        'Please sign out and sign in again to enable password changes.'
      );
    } else {
      throw new Error('No authenticated user. Please sign in to change your password.');
    }
  }
  
  if (!user || !user.email) {
    console.error('[Firebase Auth] ❌ User validation failed:', {
      hasUser: !!user,
      hasEmail: !!user?.email,
      userId: user?.uid,
    });
    throw new Error('No authenticated user. Please sign out and sign in again.');
  }
  
  try {
    // Step 1: Re-authenticate user with current password (Firebase security requirement)
    console.log('[Firebase Auth] 🔐 Step 2: Re-authenticating user with current password...', {
      userEmail: user.email,
      currentPasswordProvided: !!currentPassword,
      currentPasswordLength: currentPassword.length,
      timestamp: new Date().toISOString(),
    });
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    console.log('[Firebase Auth] 📝 Credential created, attempting re-authentication...');
    
    await reauthenticateWithCredential(user, credential);
    console.log('[Firebase Auth] ✅ Step 2: Re-authentication successful - current password is correct');
    
    // Step 2: Update password
    console.log('[Firebase Auth] 🔄 Step 3: Updating password to new password...', {
      newPasswordLength: newPassword.length,
      timestamp: new Date().toISOString(),
    });
    
    await updatePassword(user, newPassword);
    console.log('[Firebase Auth] ✅ Step 3: Password updated successfully');
    
    console.log('[Firebase Auth] 🎉 CHANGE PASSWORD COMPLETE:', {
      userId: user.uid,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
    
    return user;
  } catch (error: any) {
    // Check if it's a Firebase error by checking for 'code' property
    // Firebase errors have a 'code' property like 'auth/wrong-password'
    const isFirebaseError = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('auth/');
    
    if (isFirebaseError) {
      // For password change context, provide more specific error messages
      let friendlyMessage: string;
      const isValidationError = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password';
      
      if (isValidationError) {
        // During password change, invalid-credential means current password is wrong
        friendlyMessage = 'Current password is incorrect. Please check and try again.';
        
        // Use console.warn for expected validation errors (won't show as toast)
        console.warn('[Firebase Auth] ⚠️ Password validation failed:', {
          errorCode: error.code,
          errorMessage: error.message,
          friendlyMessage,
          context: 'password-change',
          timestamp: new Date().toISOString(),
        });
      } else {
        friendlyMessage = getFirebaseErrorMessage(error);
        
        // Use console.warn for other Firebase errors (user input related)
        console.warn('[Firebase Auth] ⚠️ Firebase error:', {
          errorCode: error.code,
          errorMessage: error.message,
          friendlyMessage,
          context: 'password-change',
          timestamp: new Date().toISOString(),
        });
      }
      
      throw new Error(friendlyMessage);
    }
    
    // For unexpected/non-Firebase errors, use console.error (these are real errors)
    console.error('[Firebase Auth] ❌ CHANGE PASSWORD ERROR (unexpected):', {
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorName: error?.name,
      hasCode: 'code' in (error || {}),
      hasMessage: 'message' in (error || {}),
      errorKeys: error ? Object.keys(error) : [],
      fullError: error,
      timestamp: new Date().toISOString(),
    });
    
    // For non-Firebase errors, throw with original message
    const errorMessage = error?.message || String(error) || 'Failed to change password. Please try again.';
    throw new Error(errorMessage);
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
function getFirebaseErrorMessage(error: { code: string; message?: string }): string {
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
    case 'auth/requires-recent-login':
      return 'For security, please re-authenticate before changing your password.';
    case 'auth/user-mismatch':
      return 'The credential provided does not match the user. Please try again.';
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different user account.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

