import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation resources
import enCommon from './resources/en/common.json';
import enAuth from './resources/en/auth.json';
import enHome from './resources/en/home.json';
import enMaintenance from './resources/en/maintenance.json';
import enVisitors from './resources/en/visitors.json';
import enAmenities from './resources/en/amenities.json';
import enProfile from './resources/en/profile.json';
import enAnnouncements from './resources/en/announcements.json';

import arCommon from './resources/ar/common.json';
import arAuth from './resources/ar/auth.json';
import arHome from './resources/ar/home.json';
import arMaintenance from './resources/ar/maintenance.json';
import arVisitors from './resources/ar/visitors.json';
import arAmenities from './resources/ar/amenities.json';
import arProfile from './resources/ar/profile.json';
import arAnnouncements from './resources/ar/announcements.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    maintenance: enMaintenance,
    visitors: enVisitors,
    amenities: enAmenities,
    profile: enProfile,
    announcements: enAnnouncements,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    home: arHome,
    maintenance: arMaintenance,
    visitors: arVisitors,
    amenities: arAmenities,
    profile: arProfile,
    announcements: arAnnouncements,
  },
};

// Get device language, default to 'en' if not supported
const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
  return SUPPORTED_LANGUAGES.includes(deviceLang as SupportedLanguage)
    ? (deviceLang as SupportedLanguage)
    : 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'auth', 'home', 'maintenance', 'visitors', 'amenities', 'profile', 'announcements'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

export const isRTL = (): boolean => {
  return getCurrentLanguage() === 'ar';
};

export default i18n;
