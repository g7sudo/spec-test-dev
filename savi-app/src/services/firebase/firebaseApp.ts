/**
 * Firebase App Initialization
 * 
 * Initializes Firebase app for React Native/Expo.
 * Provides singleton Firebase app instance.
 */

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { ENV } from '@/core/config/env';

// Firebase configuration
// TODO: Replace with actual Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA2LemBTuTrvivL0rAvVK1p8FJ8mwuh2js',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dk-dev-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'dk-dev-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dk-dev-app.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '708641852118',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:708641852118:web:ea6166cf33e0f386739777',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-8M4LPSLCT3',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Gets or initializes the Firebase app instance
 * Uses singleton pattern to prevent multiple initializations
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    // Check if Firebase is already initialized (for hot reload)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = getApp();
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
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/**
 * Initialize Firebase (call this early in app lifecycle)
 */
export function initializeFirebase(): FirebaseApp {
  return getFirebaseApp();
}

