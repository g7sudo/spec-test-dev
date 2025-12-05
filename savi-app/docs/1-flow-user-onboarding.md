Resident mobile app.

⸻

1. Top-Level States

Think of the app as 4 main “zones”:
	1.	Launch / Loading
	2.	Auth (Sign In / Sign Up / Accept Invite)
	3.	Tenant Selection (choose community)
	4.	Resident App Shell (Home + tabs: Maintenance, Visitors, Amenities, Profile, etc.)

Everything is just moving between these.

⸻

2. App Launch Flow

When user opens the app:
	1.	Splash / Loading screen
	•	App checks:
	•	Is there a logged-in Firebase user?
	•	Do we have a remembered current tenant?
	2.	Branching:
	•	Case A – Not authenticated
	•	Go to Auth Flow.
	•	Case B – Authenticated but no tenant yet
	•	Go to Tenant Selection.
	•	Case C – Authenticated + tenant already picked
	•	Go directly to Resident App Shell → Home.

⸻

3. Auth Flows

3.1 First-time login (no invite, resident self-login)
	1.	User sees Welcome / Sign In screen:
	•	Email
	•	Password
	•	(Later: “Continue with Apple/Google”)
	2.	User taps Sign In:
	•	If success → call backend to load linked communities.
	•	If error → show inline error.
	3.	After successful sign in:
	•	If no linked communities → show “No community linked” info screen.
	•	If one or more linked communities → go to Tenant Selection.

For now we’re not designing a self-signup onboarding; this is mainly “invited residents log in” + maybe existing residents.

⸻

3.2 Invite-based onboarding (most important resident flow)

Entry points:
	•	User taps invite link (email / WhatsApp) which opens:
	•	App directly (deep link)
	•	Or store → app → handled on first open

Flow:
	1.	Deep link opens app with inviteToken.
	2.	Invite Handling Screen (before or after login):
	•	If user is not logged in:
	•	Show: “You’ve been invited to join [Community Name] as a resident.”
	•	Buttons:
	•	Sign In (if they already have account)
	•	Create Account (if new)
	3.	If they choose Create Account:
	•	Show Sign Up screen with:
	•	Name
	•	Email (can be prefilled from invite)
	•	Password
	•	On success → log them in → automatically accept invite in backend.
	4.	If they choose Sign In:
	•	Go to Sign In screen.
	•	On success → process the invite and link them to the community + unit/lease.
	5.	After invite is accepted:
	•	If this is their first community → go to Tenant Selection (with that community preselected / auto-selected).
	•	If they already have communities → show Tenant Selection with all communities (including the new one).

⸻

4. Tenant Selection Flow

This is where the user chooses which community they are “inside” in the app.

4.1 When we show it
	•	After login (and invite handling), if:
	•	The user has 1 community:
	•	Either:
	•	Auto-select and jump to Resident App Shell → Home, or
	•	Show a simple “Confirm community” screen once.
	•	The user has 2+ communities:
	•	Show Tenant Selection screen.

4.2 Tenant Selection screen
	•	List of communities:
	•	Community name
	•	Address / city
	•	Optional tag: “Current home”, “Work”, etc.
	•	User taps one:
	•	Set current tenant
	•	Navigate to Resident App Shell → Home.

4.3 Switching community later

From Profile or a header menu:
	1.	User opens Profile / Settings.
	2.	Taps “Switch Community”.
	3.	Reopens Tenant Selection screen.
	4.	Selecting a different community:
	•	App reloads data in context of the new tenant.
	•	Returns to Home.

⸻

5. Resident App Shell Flow (after tenant is selected)

Once tenant is chosen, user lands in the main app shell:

5.1 Tabs / main sections

Typical bottom tab (or drawer) layout:
	•	Home
	•	Maintenance
	•	Visitors
	•	Amenities
	•	Announcements (or under Home)
	•	Profile

User flow is:
	1.	Home tab
	•	Shows:
	•	Community name + logo
	•	“My Home” section (unit, residents summary)
	•	Shortcuts to Maintenance / Visitors / Amenities
	•	From here user can:
	•	Tap View My Home → Home details screen
	•	Tap one of the shortcuts → respective feature tab/screen.

⸻

6. Core Feature User Flows (High-Level)

6.1 Maintenance request
	1.	User taps Maintenance tab (or shortcut from Home).
	2.	Sees My Requests list (status, date, category).
	3.	Taps New Request:
	•	Select category.
	•	Describe issue.
	•	Optional photos.
	4.	Taps Submit:
	•	On success → navigate to Request Detail with success message.
	•	User can later:
	•	See status changes.
	•	Add comments / see updates.

6.2 Visitor pass
	1.	User taps Visitors tab.
	2.	Sees Upcoming Visitors list.
	3.	Taps Add Visitor:
	•	Name, visit date/time, vehicle number, notes.
	4.	Taps Create Pass:
	•	Show confirmation screen with QR / pass code (future).
	5.	From list:
	•	Tap an item → Visitor Detail.

6.3 Amenity booking
	1.	User taps Amenities tab.
	2.	Sees List of amenities (Gym, Pool, Party Hall, etc.).
	3.	Selects one:
	•	Sees available time slots / rules.
	4.	Pick slot → Confirm Booking.
	5.	On success:
	•	Land on Booking Detail or back to My Bookings list.

6.4 Profile & app settings
	1.	User taps Profile tab.
	2.	Sees:
	•	Personal info.
	•	Notification preferences.
	•	Privacy options.
	•	“Switch Community”.
	•	“Sign Out”.
	3.	From here:
	•	Update profile fields.
	•	Manage notification/marketing toggles.
	•	Switch community (go to Tenant Selection).
	•	Sign out (back to Auth Flow).

⸻

7. Edge / Recovery Flows

Just to be explicit:
	•	Token expired while using app
	•	User action → API fails with unauthorized.
	•	Show small message + send user to Sign In screen.
	•	Community access revoked
	•	On fetch of communities, if current tenant no longer exists:
	•	Force back to Tenant Selection.
	•	If now 0 communities → show “No community linked” screen.
⸻

1. What adding on top

New layers on top of the existing resident flow:
	•	Splash screen (brand + loading)
	•	Marketing onboarding screens (carousel)
	•	“Get started / Sign up / Sign in” entry
	•	Consent & permissions
	•	Analytics / tracking (Google Analytics for Firebase)
	•	Ads (Google Ads / AdMob – ideally after consent)
	•	Push notifications (Firebase Cloud Messaging)
	•	Then → existing Auth → Tenant selection → App flow

Think of it as Pre-Auth UX.

⸻

2. First Launch Flow (cold start, brand new install)

2.1 Splash / Native loading
	1.	User opens app.
	2.	Splash screen:
	•	App logo + name + your brand color.
	•	In background:
	•	Initialize Firebase.
	•	Check if user is logged in.
	•	Check if onboarding already completed.
	3.	Since it’s first launch:
	•	No user
	•	No onboarding flag
→ Move to Onboarding Carousel.

⸻

2.2 Onboarding carousel (fancy marketing screens)

3–4 screens max, swipeable:
	1.	Screen 1: “Welcome to SAVI / GameSetter / …”
	•	Short value prop (“Manage your home & community in one place”).
	2.	Screen 2: Key benefits
	•	“Track maintenance requests”
	•	“Manage visitors”
	•	“Book amenities”
	3.	Screen 3: Trust & notifications
	•	“Stay informed with instant notifications”
	•	“Your data is secure & private”

At bottom of all screens:
	•	Primary button: Get Started
	•	Secondary: Sign In
	•	Small link: “Already have an account? Sign In”

When user taps:
	•	Sign In → go directly to Auth flow.
	•	Get Started → go to Consent & Permissions screen.

You set a flag like onboardingCompleted = true after they leave this carousel.

⸻

2.3 Consent & Permissions screen

This is where you ask permission before showing OS dialogs or tracking:

“Before we start…” screen

Content:
	•	Short text: “To give you the best experience, we’d like to use:”
	•	Sections with toggles/choices:

	1.	Analytics & usage data
	•	“Help us improve the app by sending anonymous usage data.”
	•	Toggle: Allow analytics (default ON, but user can turn OFF).
	2.	Personalized experience / ads
	•	“Allow us to personalize content and offers for you.”
	•	Toggle: Allow personalization/ads.
	•	(If OFF, you can still show non-personalized or no ads.)
	3.	Push notifications
	•	“Get alerts for maintenance updates, visitor arrivals, and announcements.”
	•	Button: Enable Notifications (tapping this will bring OS permission dialog).
	•	Small link: Not now to skip.

Buttons at bottom:
	•	Continue (save preferences, request notification permission if they tapped “Enable”)
	•	Optional: link to “Privacy Policy”

Flow:
	1.	User sets toggles.
	2.	If they chose Enable Notifications:
	•	Show OS permission prompt after they press Continue.
	3.	Save their choices locally (and send to backend later).
	4.	Move to Auth flow (Sign Up / Sign In / “I have an invite”).

⸻

2.4 Auth + Invite flow (as before, but with tracking)

From here it’s your previous flow, but now with tracking:
	1.	Sign In / Sign Up / Accept Invite screens.
	2.	On successful auth:
	•	Log analytics events: login_success, signup_success, invite_accepted.
	3.	Fetch linked communities.
	4.	Tenant Selection:
	•	If 1 community → auto-select.
	•	If many → show community list.
	5.	After tenant picked:
	•	Navigate to Home (Resident App Shell).
	•	Fire tenant_selected event with tenantId.

⸻

3. Subsequent Launches

When user opens the app again:
	1.	Splash screen
	•	Check:
	•	Is user logged in?
	•	Is tenant stored?
	•	Is onboardingCompleted flag set?
	•	Are notification/analytics permissions still valid?
	2.	Branch:

	•	Case 1 – Logged in + tenant set
	•	Skip onboarding & auth.
	•	Go straight to Home.
	•	Case 2 – Logged in, no tenant
	•	Go to Tenant Selection.
	•	Case 3 – Not logged in but onboardingCompleted is true
	•	Skip onboarding carousel.
	•	Go straight to Auth (Sign In / Sign Up).

You only show the fancy onboarding once per install unless user logs out and you explicitly let them revisit it from settings.

⸻

4. Where Firebase / Analytics / Ads / Push fit in

4.1 Firebase modules
	•	Firebase Authentication
	•	Used in Auth flow (sign in / sign up / token refresh).
	•	Firebase Cloud Messaging
	•	Used after user allows notifications.
	•	Push token sent to backend once user is logged in + tenant chosen.
	•	Google Analytics for Firebase
	•	Start collecting after consent.
	•	Track:
	•	onboarding_viewed
	•	onboarding_completed
	•	consent_given + flags for analytics/ads/notifications
	•	login_success / signup_success
	•	tenant_selected
	•	maintenance_created, visitor_pass_created, etc.

4.2 Ads (Google Ads / AdMob)
	•	Only show ads inside the app shell, not on:
	•	Onboarding
	•	Auth
	•	Consent screens
	•	Respect consent:
	•	If user allowed personalization → request personalized ads.
	•	If not → either non-personalized ads or no ads (your call).

Placement ideas (for later; you can start without ads):
	•	Small banner on Announcements or Amenities lists.
	•	Interstitial occasionally on non-critical transitions (not on maintenance create/submit).

⸻

5. Notifications UX

Where the user controls this later:
	•	In Profile → Notifications & Privacy:
	•	Toggles:
	•	Maintenance updates
	•	Visitor alerts
	•	Community announcements
	•	“Open system settings” button if OS notifications are disabled.

Flow:
	1.	User lands in Profile.
	2.	Taps Notification Settings.
	3.	Adjusts toggles.
	4.	You update backend + maybe show info if OS-level notifications are off.

