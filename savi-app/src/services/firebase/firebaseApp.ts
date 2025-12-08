/**
 * Firebase App Initialization
 * 
 * Initializes Firebase app for React Native/Expo.
 * Provides singleton Firebase app instance.
 */

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  Auth,
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
let authInitialized = false;

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
 * Gets the Firebase Auth instance with AsyncStorage persistence
 * 
 * Uses initializeAuth with ReactNativePersistence to persist auth state
 * between app sessions. This ensures users stay logged in after app restarts.
 * 
 * Note: initializeAuth must be called before getAuth. If auth was already
 * initialized without persistence, this will initialize it with persistence.
 */
export function getFirebaseAuth(): Auth {
  if (!auth || !authInitialized) {
    const firebaseApp = getFirebaseApp();
    
    // Initialize auth with AsyncStorage persistence for React Native
    // This persists authentication state between app sessions
    try {
      auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      authInitialized = true;
      console.log('[Firebase Auth] ✅ Initialized with AsyncStorage persistence');
    } catch (error: any) {
      // If auth is already initialized (e.g., during hot reload), get existing instance
      if (error.code === 'auth/already-initialized') {
        auth = getAuth(firebaseApp);
        authInitialized = true;
        console.log('[Firebase Auth] ⚠️ Auth already initialized, using existing instance');
      } else {
        throw error;
      }
    }
  }
  return auth;
}

/**
 * Initialize Firebase (call this early in app lifecycle)
 */
export function initializeFirebase(): FirebaseApp {
  return getFirebaseApp();
}

