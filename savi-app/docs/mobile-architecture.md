Mobile App Technical Architecture & Folder Structure

1. Scope & Tech Stack

App: Resident-facing SAVI mobile app (enterprise-grade).

Tech stack
	•	Framework: React Native + Expo (managed workflow)
	•	Language: TypeScript
	•	Navigation: React Navigation
	•	Server state: TanStack Query (React Query)
	•	App state: Zustand
	•	Backend: SAVI API (.NET 8, multi-tenant, JWT via Firebase Auth)
	•	External services
	•	Firebase Auth
	•	Firebase Cloud Messaging (FCM)
	•	Google Analytics for Firebase
	•	Google Ads / AdMob
	•	Remote Config or custom /mobile/config endpoint for force update
	•	Cross-cutting concerns
	•	Dark / light mode
	•	Multilingual (e.g., EN + AR)
	•	Onboarding & consent
	•	Push notifications
	•	Analytics & Ads
	•	Force update

⸻

1. Runtime Flow Overview

High-level user flow (always starting at Splash):
	1.	Native Splash Screen
	•	Configured in app.json, shown by OS while JS bundle loads.
	2.	JS Splash Screen (Startup)
	•	First rendered screen inside React Navigation.
	•	Runs useStartup() hook and decides the next route.
	3.	Possible next states from Splash
	•	ForceUpdateScreen (blocking) – if current app version < min supported.
	•	Onboarding/Consent flow – if first launch (no onboardingCompleted).
	•	Auth flow – if not authenticated.
	•	Tenant selection – if authenticated but no current tenant chosen.
	•	Main app shell (Home) – if authenticated + tenant selected.

⸻

3. Folder Structure

src/
  app/
    App.tsx
    navigation/
      RootNavigator.tsx
      AuthNavigator.tsx
      MainNavigator.tsx
      types.ts

  features/
    startup/
      screens/
        SplashScreen.tsx
        ForceUpdateScreen.tsx
      hooks/
        useStartup.ts
      types.ts
      index.ts

    onboarding/
      screens/
        OnboardingScreen.tsx
        ConsentScreen.tsx
      hooks/
        useOnboarding.ts
      components/
        OnboardingSlide.tsx
      index.ts

    auth/
      screens/
        SignInScreen.tsx
        SignUpScreen.tsx
      hooks/
        useAuth.ts
      services/
        authApi.ts
      types.ts

    tenant/
      screens/
        TenantSelectScreen.tsx
      hooks/
        useTenantSelection.ts
      services/
        tenantApi.ts
      types.ts

    home/
      screens/
        HomeScreen.tsx
      hooks/
        useHomeData.ts
      components/
        MyHomeCard.tsx
        QuickActions.tsx

    maintenance/
      screens/
        MaintenanceListScreen.tsx
        MaintenanceDetailScreen.tsx
        MaintenanceCreateScreen.tsx
      hooks/
        useMaintenanceList.ts
        useMaintenanceDetail.ts
        useCreateMaintenance.ts
      services/
        maintenanceApi.ts
      types.ts

    visitors/
      screens/
        VisitorListScreen.tsx
        VisitorCreateScreen.tsx
      hooks/
        useVisitors.ts
        useCreateVisitor.ts
      services/
        visitorsApi.ts
      types.ts

    amenities/
      screens/
        AmenityListScreen.tsx
        AmenityBookingScreen.tsx
        AmenityBookingListScreen.tsx
      hooks/
        useAmenities.ts
        useCreateBooking.ts
      services/
        amenitiesApi.ts
      types.ts

    profile/
      screens/
        ProfileScreen.tsx
        NotificationSettingsScreen.tsx
        LanguageSettingsScreen.tsx
        ThemeSettingsScreen.tsx
      hooks/
        useProfile.ts
      services/
        profileApi.ts
      types.ts

  core/
    config/
      env.ts             # API base URLs, app version, build-time flags
      constants.ts       # Non-secret constants
      featureFlags.ts    # Feature toggles

    theme/
      ThemeProvider.tsx  # Wraps the app with theme context
      theme-light.ts
      theme-dark.ts
      types.ts
      useTheme.ts
      useColorSchemePreference.ts

    i18n/
      i18n.ts
      useTranslation.ts
      resources/
        en/
          common.json
          auth.json
          home.json
          maintenance.json
        ar/
          common.json
          auth.json
          home.json
          maintenance.json

    notifications/
      notifications.ts   # FCM + OS permission management
      useNotifications.ts
      types.ts

    analytics/
      analytics.ts       # Google Analytics wrapper
      events.ts          # Event constants
      types.ts

    ads/
      ads.ts             # AdMob wrapper (init, components)
      placements.ts      # Placement names/ids

    update/
      updateChecker.ts   # Force update / soft update logic
      types.ts

  services/
    api/
      apiClient.ts       # axios/fetch wrapper
      interceptors.ts    # auth & tenant interceptors
      queryClient.ts     # React Query client

    firebase/
      firebaseApp.ts     # Initialize Firebase app
      auth.ts            # Firebase auth helpers
      messaging.ts       # FCM helpers
      remoteConfig.ts    # Remote Config (if used)

    storage/
      asyncStorage.ts
      secureStorage.ts   # (if needed)
      keys.ts            # Storage key constants

  state/
    appStore.ts          # theme, language, onboarding, consent, etc.
    authStore.ts         # auth state
    tenantStore.ts       # current tenant, tenant list

  shared/
    components/
      ui/
        Button.tsx
        Text.tsx
        Icon.tsx
        Screen.tsx
        TextInput.tsx
        Switch.tsx
      layout/
        Row.tsx
        Column.tsx
        Spacer.tsx
      feedback/
        Toast.tsx
        LoadingOverlay.tsx
        ErrorState.tsx

    hooks/
      useSafeAsyncEffect.ts
      useBoolean.ts
      useDebounce.ts

    utils/
      formatting.ts
      validation.ts
      logger.ts
      platform.ts

  types/
    api.ts               # DTOs – backend contracts
    models.ts            # App-level domain models
    navigation.ts        # Shared nav param types


⸻

4. Module Responsibilities

4.1 app/App.tsx
	•	Bootstraps the app:
	•	Wraps in providers: ThemeProvider, QueryClientProvider, Zustand provider (if needed), i18n provider, etc.
	•	Renders RootNavigator.

4.2 app/navigation/RootNavigator.tsx
	•	Determines root stack:
	•	Always starts at SplashScreen (from features/startup).
	•	After startup decides, navigates to:
	•	Force update stack
	•	Auth stack
	•	Main stack (tenant + app shell)

4.3 app/navigation/AuthNavigator.tsx
	•	Flows:
	•	Onboarding → Consent → SignIn/SignUp → TenantSelect
	•	Invite/DeepLink handling (later).

4.4 app/navigation/MainNavigator.tsx
	•	Contains:
	•	Tab or bottom-navigation:
	•	Home
	•	Maintenance
	•	Visitors
	•	Amenities
	•	Profile
	•	Each tab points to corresponding feature’s main screen.

⸻

1. Startup / Splash Logic (features/startup)

5.1 SplashScreen.tsx
	•	UI:
	•	Logo, app name, maybe loading indicator.
	•	Behavior:
	•	Calls useStartup() on mount.

5.2 useStartup.ts – the startup sequence
Responsibilities:
	1.	Hydrate local config & stores
        •	Read from storage (services/storage/asyncStorage.ts):
        •	onboardingCompleted
        •	themeMode
        •	language
        •	analyticsEnabled
        •	adsPersonalizationEnabled
        •	Last selected tenant (if any)
        •	Update appStore and tenantStore accordingly.
	2.	Initialize integrations
        •	Initialize Firebase (firebaseApp.ts).
        •	Set up Analytics, Ads base config as needed (respecting stored consent).
        •	Optionally register base notification handlers (not requesting permission yet).
	3.	Force update check
        •	Call core/update/updateChecker.ts:
        •	Uses either:
        •	services/firebase/remoteConfig.ts, or
        •	apiClient to hit /mobile/config or similar.
        •	Compares:
        •	currentAppVersion (from core/config/env.ts)
        •	minSupportedVersion, latestVersion.
        •	Branch:
        •	If force_update → navigate to ForceUpdateScreen and stop.
        •	If soft_update → store flag for later, but continue.
	4.	Auth state check
        •	Check Firebase Auth for a current user.
        •	If no user:
        •	Check onboardingCompleted:
        •	If false → go to Onboarding flow.
        •	If true → go directly to Auth flow (SignIn / SignUp).
        •	If user exists:
        •	Optionally refresh ID token.
        •	Call backend /me as needed to load backend user and memberships into authStore.
	5.	Tenant resolution
        •	If user is authenticated:
        •	Load tenant list via tenantApi.getUserTenants.
            •	If 0 → show “No community linked” screen (within tenant feature).
            •	If 1 and last selected tenant is consistent → set currentTenant and go to Main app (Home).
            •	If multiple or no remembered tenant → go to TenantSelectScreen.

In summary:

Native Splash
   ↓
JS SplashScreen + useStartup()
   ↓
[force update?] → ForceUpdateScreen
[else if !auth + !onboardingCompleted] → Onboarding
[else if !auth] → Auth (SignIn/SignUp)
[else if auth + needs tenant] → TenantSelect
[else] → Home (Main)

5.3 ForceUpdateScreen.tsx
	•	Blocking screen when currentVersion < minSupportedVersion.
	•	Shows:
	•	Message from updateChecker (e.g., “Please update to continue”).
	•	Button: “Update app” (opens App Store / Play Store).
	•	No way to bypass from UI.

⸻

6. Core Modules (Summary)

6.1 core/theme
	•	Central theme system with:
	•	ThemeProvider at root.
	•	theme-light.ts and theme-dark.ts defining color palettes.
	•	App store holds:
	•	themeMode: 'light' | 'dark' | 'system'.
	•	useTheme() gives access to semantic colors & spacing.

6.2 core/i18n
	•	i18n.ts sets up i18next or similar.
	•	useTranslation(namespace) wraps translation, respects app language from appStore.
	•	resources/<lang>/<namespace>.json hold translations grouped by feature (auth, home, maintenance, etc.).

6.3 core/notifications
	•	notifications.ts:
	•	requestNotificationPermission()
	•	getFcmToken()
	•	registerNotificationHandlers()
	•	useNotifications.ts used in:
	•	Consent screen (request permission, send token).
	•	App shell startup (restore subscription, etc.).

6.4 core/analytics
	•	analytics.ts:
	•	trackEvent(name, params)
	•	setUserId(id)
	•	setUserProperties(props)
	•	Wrapper respects appStore.analyticsEnabled.

6.5 core/ads
	•	ads.ts:
	•	initAds()
	•	BannerAd wrapper
	•	showInterstitial(placementId)
	•	Reads appStore.adsPersonalizationEnabled to decide personalization.

6.6 core/update
	•	updateChecker.ts:
	•	checkForUpdate(): Promise<UpdateResult> where:
	•	type: 'none' | 'soft_update' | 'force_update'
	•	message: string
	•	storeUrl: string

⸻

7. Services Layer

7.1 services/api/apiClient.ts
	•	Single HTTP entry point:
	•	Base URL from env.ts.
	•	Injects:
	•	Authorization header from authStore (Firebase ID token).
	•	X-Tenant-Id from tenantStore.
	•	Global interceptors:
	•	On 401/403:
	•	Clear auth, navigate to Auth stack.
	•	Normalize error shape.

7.2 services/firebase/*
	•	firebaseApp.ts: Initializes Firebase.
	•	auth.ts: Sign-in/out helpers, token refresh.
	•	messaging.ts: FCM token + handlers.
	•	remoteConfig.ts: Get remote config for update/feature flags, if used.

⸻

8. State Strategy
	•	Global app state: state/appStore.ts, state/authStore.ts, state/tenantStore.ts.
	•	Server state: React Query in feature hooks.
	•	Local UI state: Component state or small feature-local hooks.

⸻

9. Navigation & Deep Linking
	•	Root always starts at SplashScreen.
	•	All flows (invite link, push notification taps) eventually go through startup + navigation logic and respect:
	•	auth state
	•	tenant selection
	•	force update state

⸻

📄 mobile-guidelines.md – Development Guidelines

1. Goals
	•	Keep the app modular, testable, and maintainable.
	•	Enforce consistent patterns for:
	•	Feature organization
	•	State management
	•	Theming, i18n
	•	Startup logic (splash checks)
	•	Notifications, analytics, ads, updates

⸻

2. General Rules
	1.	Feature-first
	•	Place screens, hooks, and services for a feature under features/<featureName>/.
	2.	No direct network calls in screens
	•	Screens use hooks; hooks use apiClient, not fetch/axios directly.
	3.	Typed APIs
	•	All API responses and payloads use TypeScript types/interfaces.
	4.	No hard-coded user-facing strings
	•	Always use i18n t().

⸻

3. Working with Startup & Splash

Never put logic in App.tsx that decides navigation directly. The rule:
	•	All startup decisions go through useStartup().

When modifying startup behavior:
	1.	Open features/startup/hooks/useStartup.ts.
	2.	Add or adjust steps in this order:
	1.	Hydrate local config/state.
	2.	Initialize Firebase and cross-cutting services.
	3.	Force update check.
	4.	Auth state check.
	5.	Tenant resolution.
	3.	Use navigation actions from RootNavigator to go to final destination:
	•	ForceUpdate
	•	OnboardingStack
	•	AuthStack
	•	TenantSelect
	•	MainApp

Do not duplicate version checks or auth checks somewhere else at startup – they must live in the startup hook.

⸻

4. Adding a New Feature

Example: New feature "complaints".
	1.	Create structure

features/complaints/
  screens/
    ComplaintListScreen.tsx
    ComplaintDetailScreen.tsx
    ComplaintCreateScreen.tsx
  hooks/
    useComplaintList.ts
    useComplaintDetail.ts
    useCreateComplaint.ts
  services/
    complaintsApi.ts
  types.ts

	2.	API layer
	•	complaintsApi.ts:
	•	Use apiClient.
	•	Define functions like getComplaints, getComplaintById, createComplaint.
	•	Import DTO types from types/api.ts or define per-feature types.
	3.	Hooks
	•	Use React Query for server state in hooks/:
	•	useComplaintList → useQuery(['complaints', params], complaintsApi.getComplaints)
	•	useCreateComplaint → useMutation(complaintsApi.createComplaint)
	4.	Screens
	•	Use only:
	•	Feature hooks (useComplaintList, etc.)
	•	Shared components (Screen, Button, etc.)
	•	i18n useTranslation('complaints')
	•	useTheme() for colors.
	5.	Navigation
	•	Integrate screens into MainNavigator or nested stack.
	•	Add route types in app/navigation/types.ts and types/navigation.ts if needed.
	6.	Localization
	•	Add complaints.json under each language:
	•	core/i18n/resources/en/complaints.json
	•	core/i18n/resources/ar/complaints.json
	7.	Analytics / Ads
	•	Define events in core/analytics/events.ts.
	•	Use trackEvent in hooks after significant actions.
	•	If ads: use placements from core/ads/placements.ts.

⸻

5. State Management Guidelines

Use React Query when:
	•	Reading/writing data from/to backend.
	•	Need caching, refetch, stale-while-revalidate.

Use Zustand/Redux (global stores) when:
	•	State is global and cross-feature:
	•	Auth user
	•	Current tenant
	•	App language/theme
	•	Consent preferences

Use local state when:
	•	It’s pure UI detail, not needed outside the component:
	•	Toggles, open/close modals, typed input values (not yet saved).

⸻

6. Theming Guidelines
	•	Only define color values in theme-light.ts and theme-dark.ts.
	•	Use semantic tokens, e.g.:
	•	colors.primary, colors.background, colors.surface, colors.textPrimary, colors.error, colors.border.
	•	Components/screens must use useTheme():
	•	Do not import theme files directly.
	•	Do not hard-code hex colors.

Changing theme:
	•	Use useColorSchemePreference() to:
	•	Read and update themeMode in appStore.
	•	Persist to storage.

⸻

7. Localization Guidelines
	•	Every string shown to the user comes from i18n.

Pattern:

const { t } = useTranslation('auth');

<Text>{t('signIn.title')}</Text>

File organization:
	•	common.json – shared labels (ok, cancel, save, etc.)
	•	<feature>.json – feature-specific text.

When adding a new key:
	1.	Update EN file.
	2.	Update AR (or mark as TODO).
	3.	Use the key in code via t(namespace.key).

⸻

8. Notifications Guidelines
	•	OS notification prompt should only be shown from:
	•	Consent screen in onboarding, or
	•	Notification settings screen in Profile.

Flow:
	1.	User opts in (toggle/button).
	2.	Call requestNotificationPermission() from core/notifications.
	3.	Store result in appStore.notificationPermissionStatus.
	4.	If granted:
	•	Retrieve FCM token (getFcmToken()).
	•	Call backend API to register device with:
	•	user id
	•	tenant id(s)
	•	token.
	5.	If denied:
	•	Respect choice. Do not repeatedly prompt; allow user to re-enable from Profile.

⸻

9. Analytics Guidelines
	•	Use core/analytics/analytics.ts only.
	•	Do not call Firebase Analytics directly from features.

Pattern:

import { trackEvent } from '@/core/analytics/analytics';
import { EVENTS } from '@/core/analytics/events';

trackEvent(EVENTS.MAINTENANCE_CREATED, { priority, category });

Rules:
	•	Respect appStore.analyticsEnabled.
	•	Do not log sensitive personal data.
	•	Bind events to real user actions (screen views, submit, success, error if needed).

⸻

10. Ads Guidelines
	•	Ads are never shown on:
	•	Splash
	•	Onboarding
	•	Consent
	•	Auth
	•	Force update
	•	Ads are allowed on:
	•	Home
	•	Amenities
	•	Announcements
	•	Other non-critical lists.

Use only core/ads/ads.ts & core/ads/placements.ts.
	•	Respect appStore.adsPersonalizationEnabled:
	•	If false, request non-personalized ads (or disable ads for that user).

⸻

11. Force Update Guidelines
	•	Version logic lives only in core/update/updateChecker.ts and useStartup().

Flow:
	1.	At startup (in useStartup()), call checkForUpdate().
	2.	If type === 'force_update':
	•	Navigate to ForceUpdateScreen.
	•	Do not allow proceeding into the app.
	3.	If type === 'soft_update':
	•	Store the flag (e.g., in appStore) for later.
	•	Show optional banner or prompt inside main app.
	4.	If type === 'none':
	•	Proceed with normal startup flow.

⸻

12. Code Style & Testing
	•	TypeScript strict: enable strict options for early error detection.
	•	ESLint + Prettier: enforce consistent style and imports.
	•	Component testing (where possible):
	•	Test screens with mocked hooks.
	•	Test hooks with mocked apiClient and React Query.

⸻
