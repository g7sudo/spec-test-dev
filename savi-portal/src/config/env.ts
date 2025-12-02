/**
 * Environment configuration for SAVI Portal
 * Centralizes all environment variable access with type safety
 */

// API base URL for backend calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5024';

// Firebase configuration for authentication
export const firebaseConfig = {
    apiKey: "AIzaSyA2LemBTuTrvivL0rAvVK1p8FJ8mwuh2js",
    authDomain: "dk-dev-app.firebaseapp.com",
    projectId: "dk-dev-app",
    storageBucket: "dk-dev-app.firebasestorage.app",
    messagingSenderId: "708641852118",
    appId: "1:708641852118:web:ea6166cf33e0f386739777",
    measurementId: "G-8M4LPSLCT3"
};

// App settings
export const APP_NAME = 'SAVI';
export const DEFAULT_PAGE_SIZE = 20;

// Session settings
export const SESSION_STORAGE_KEY = 'savi_last_scope';
export const TOKEN_STORAGE_KEY = 'savi_auth_token';
