import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '@/core/theme/types';
import { SupportedLanguage } from '@/core/i18n';

interface AppState {
  // Onboarding
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  completeOnboarding: () => void;

  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Language
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

  // Consent
  termsConsent: boolean;
  setTermsConsent: (consent: boolean) => void;
  privacyConsent: boolean;
  setPrivacyConsent: (consent: boolean) => void;
  notificationsConsent: boolean;
  setNotificationsConsent: (consent: boolean) => void;
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (enabled: boolean) => void;
  adsPersonalizationEnabled: boolean;
  setAdsPersonalizationEnabled: (enabled: boolean) => void;
  notificationPermissionStatus: 'undetermined' | 'granted' | 'denied';
  setNotificationPermissionStatus: (status: 'undetermined' | 'granted' | 'denied') => void;

  // App state
  isAppReady: boolean;
  setIsAppReady: (ready: boolean) => void;
  softUpdateAvailable: boolean;
  setSoftUpdateAvailable: (available: boolean) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Onboarding
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      completeOnboarding: () => set({ onboardingCompleted: true }),

      // Theme
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),

      // Language
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // Consent
      termsConsent: false,
      setTermsConsent: (consent) => set({ termsConsent: consent }),
      privacyConsent: false,
      setPrivacyConsent: (consent) => set({ privacyConsent: consent }),
      notificationsConsent: false,
      setNotificationsConsent: (consent) => set({ notificationsConsent: consent }),
      analyticsEnabled: true,
      setAnalyticsEnabled: (enabled) => set({ analyticsEnabled: enabled }),
      adsPersonalizationEnabled: true,
      setAdsPersonalizationEnabled: (enabled) => set({ adsPersonalizationEnabled: enabled }),
      notificationPermissionStatus: 'undetermined',
      setNotificationPermissionStatus: (status) => set({ notificationPermissionStatus: status }),

      // App state
      isAppReady: false,
      setIsAppReady: (ready) => set({ isAppReady: ready }),
      softUpdateAvailable: false,
      setSoftUpdateAvailable: (available) => set({ softUpdateAvailable: available }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        themeMode: state.themeMode,
        language: state.language,
        termsConsent: state.termsConsent,
        privacyConsent: state.privacyConsent,
        notificationsConsent: state.notificationsConsent,
        analyticsEnabled: state.analyticsEnabled,
        adsPersonalizationEnabled: state.adsPersonalizationEnabled,
        notificationPermissionStatus: state.notificationPermissionStatus,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks for convenience
export const useOnboardingCompleted = () => useAppStore((state) => state.onboardingCompleted);
export const useThemeMode = () => useAppStore((state) => state.themeMode);
export const useLanguage = () => useAppStore((state) => state.language);
export const useAnalyticsEnabled = () => useAppStore((state) => state.analyticsEnabled);
export const useIsAppReady = () => useAppStore((state) => state.isAppReady);
export const useAppHasHydrated = () => useAppStore((state) => state._hasHydrated);
