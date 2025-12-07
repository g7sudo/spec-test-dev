Resident mobile app – Home Screen PRD

⸻

1. Purpose & Scope

This document defines the Resident app Home screen for the selected community (tenant).

Scope:
	•	Default landing screen after onboarding + auth + tenant selection.
	•	Layout, sections, states, and navigation for the Home tab.
	•	How Home connects to upstream flows (UserOnboardingFlow, maintenance, visitors, amenities, community feed).

Out of scope:
	•	Detailed flows for maintenance, visitors, amenities, payments, profile, etc. (covered in separate docs like maintainance-flow.md).

⸻

2. Relationship to UserOnboardingFlow

See: savi-app/docs/UserOnboardingFlow.md

Think of Home as the main entry into the “Resident App Shell” zone described there.

2.1 First launch (brand new install)
	1.	User opens app.
	2.	Flow follows UserOnboardingFlow:
	•	Splash / loading
	•	Onboarding carousel
	•	Consent & permissions
	•	Auth + Invite handling
	•	Tenant selection
	3.	After tenant is selected:
	•	Navigate to Resident App Shell → Home.
	•	Fire analytics events: login_success / signup_success / tenant_selected (as defined there) + home_viewed.

2.2 Subsequent launches
	1.	Splash screen checks:
	•	Is user logged in?
	•	Do we have a stored current tenant?
	•	Is onboardingCompleted flag set?
	2.	Branching (same as UserOnboardingFlow):
	•	Logged in + tenant set → go directly to Home.
	•	Logged in, no tenant → Tenant Selection → Home.
	•	Not logged in but onboardingCompleted = true → Auth → Tenant Selection → Home.

2.3 Switching community later
	1.	From Profile / Settings, user taps “Switch Community”.
	2.	Tenant Selection screen opens (see onboarding doc).
	3.	When user picks a tenant:
	•	Set current tenant.
	•	Reload all Home sections in that tenant context.
	•	Fire tenant_selected + home_viewed events.

2.4 Consent, analytics, and ads
	•	Respect analytics and ads/personalization toggles from Consent & Permissions.
	•	Home may show:
	•	Promotional banner.
	•	Featured offers carousel.
	•	These must comply with:
	•	If analytics consent is OFF → limit analytics events to essential operational ones.
	•	If ads/personalization consent is OFF → show only non-personalized offers or hide ad-driven sections as configured.

⸻

3. High-Level UX

3.1 Role of Home
	•	Single “command center” for residents after they are inside a community.
	•	Provides:
	•	Snapshot of dues, visitors, maintenance requests, community updates.
	•	Quick actions into core flows (maintenance, visitors, amenities, emergency, announcements).

3.2 Shell & navigation
	•	Home is 1 of the main tabs in the Resident App Shell.
	•	Bottom tab bar (persistent):
	•	Home
	•	Facility
	•	Services
	•	Community
	•	Home is the default tab after entering the shell.
	•	Switching tabs:
	•	Updates selected state.
	•	Replaces main content area with that tab’s root screen.
	•	Bottom nav stays fixed.

⸻

4. Layout Overview (Top → Bottom)

Overall:
	•	Main content is vertically scrollable.
	• Sections are:
	1.	App header (unit + city + icons)
	2.	Outstanding Bill Drawer (conditional)
	3.	Household / resident avatars strip
	4.	Quick action grid
	5.	My Visitors
	6.	My Requests (Maintenance)
	7.	Community Feeds
	8.	Promotional banner (campaign / offers)
	9.	Featured For You carousel
	10.	Bottom tab bar (persistent)

⸻

5. Header & Identity

5.1 Header content
	•	Top-left: resident avatar.
	•	Title: unit identifier + block, e.g., “Block A‑001”.
	•	Subtitle: city / community location, e.g., “Chennai”.
	•	Top-right icons:
	•	Notifications bell → opens Notifications screen.
	•	Secondary icon (e.g., outline circle) → opens additional options / profile menu (implementation detail).

5.2 Behaviour
	•	Tapping avatar → Profile / Settings screen.
	•	Tapping notifications icon → Notifications list with read/unread states.

⸻

6. Outstanding Bill Drawer (Due Banner)

6.1 When to show
	•	Show a prominent due banner when:
	•	Resident has at least one unpaid or overdue bill relevant to this unit/tenant (e.g., electricity bill).
	•	If multiple unpaid bills exist:
	•	Show the most urgent one (nearest due date) in the banner.
	•	Other bills live in a separate Bills/Payments screen.

6.2 Content
	•	Full-width yellow gradient card below header.
	•	Fields:
	•	Bill title (e.g., “Electricity bill”).
	•	Short warning copy: “Pay your bill today to avoid late charges.”
	•	Due date text: “Due date 20 Sep 2025”.
	•	Primary CTA button: “Pay Now”.

6.3 Behaviour
	•	Tap “Pay Now”:
	•	Navigate to bill/payment screen with this bill pre-selected.
	•	Fire analytics event: bill_pay_cta_clicked (billId, tenantId).
	•	Banner has a dismiss/close icon:
	•	On dismiss, hide for the rest of the session.
	•	Optionally persist a short-lived snooze flag so it does not reappear constantly.
	•	If no unpaid bills or after all are paid:
	•	Do not render the banner; rest of layout shifts up.

⸻

7. Household / Residents Avatar Strip

7.1 Content
	•	Horizontal row of circular avatars for residents / household members linked to the current unit.
	•	Some avatars can show a small “New” badge (e.g., new member, pending setup).

7.2 Behaviour
	•	Strip is horizontally scrollable if more avatars than fit.
	•	Tapping avatar:
	•	Opens that person’s profile / member detail.

⸻

8. Quick Actions Grid

8.1 Actions & layout
	•	2 x 3 grid of quick-action tiles:
	1.	Pre-Register Visitor
	2.	Maintenance Request
	3.	Give Feedback
	4.	Book Facility
	5.	Emergency
	6.	Announcements

	•	Each tile contains:
	•	Icon + label.
	•	Touch area sized to mobile guidelines.

8.2 Navigation mapping
	•	Pre-Register Visitor → opens “Add / Pre-register Visitor” flow under Visitors module.
	•	Maintenance Request → opens “Create new maintenance request” in Maintenance module.
	•	Give Feedback → opens resident feedback form (module TBD).
	•	Book Facility → opens Amenities / Facility booking list (Gym, Pool, Party Hall, etc.).
	•	Emergency → opens Emergency screen:
	•	Shortcut to call security or configured emergency contacts.
	•	Announcements → opens Announcements list screen.

8.3 States & rules
	•	Emergency tile is always visible; never hidden.
	•	Announcements tile can show an unread indicator when there are unread announcements.
	•	If some features are disabled for a tenant, tiles can be hidden by configuration (except Emergency).

8.4 Analytics
	•	On tap, fire home_quick_action_clicked with:
	•	action ∈ {pre_register_visitor, maintenance_request, give_feedback, book_facility, emergency, announcements}.

⸻

9. My Visitors

9.1 Content
	•	Section header: “My Visitors”.
	•	Right-aligned link: “View all”.
	•	Horizontally scrollable visitor cards with:
	•	Visitor name (e.g., “Dr. John Doe”).
	•	Target flat (e.g., “Flat no. 203”).
	•	Visit date & time (e.g., “Wed 10, 10:00 AM”).
	•	Small avatar/image on the right.
	•	Page indicator dots below cards (current page vs total).

9.2 Data & ordering
	•	Show upcoming visitors first, sorted by visit time (soonest at left).
	•	If no upcoming visitors:
	•	Show most recent visitors (last N days).

9.3 Behaviour
	•	Tapping “View all”:
	•	Navigates to Visitors tab/list for this unit.
	•	Fires analytics: home_visitors_view_all_clicked.
	•	Tapping a visitor card:
	•	Opens Visitor Detail screen (details, QR/pass, etc.).

9.4 Empty state
	•	If there are no upcoming or recent visitors:
	•	Display message: “No visitors yet”.
	•	Show inline CTA: “Pre-register visitor” → same as Pre-Register Visitor quick action.

⸻

10. My Requests (Maintenance)

10.1 Content
	•	Section header: “My Requests”.
	•	List of recent maintenance requests for the user + unit (2–3 items).
	•	Each row displays:
	•	Title (e.g., “Leaking Bathroom Faucet”).
	•	Request date & time.
	•	Service type / category (e.g., “Plumber”, “AC Tech”).
	•	Status pill with colour-coding (e.g., Pending, Confirmed, Completed).
	•	Right side: “View details” link.

10.2 Status mapping (to Maintenance tables)
	•	Visual statuses must map to MaintenanceStatus from docs/maintainance-flow.md.
	•	Examples:
	•	New / Assigned → “Pending” (yellow).
	•	InProgress → “In progress” (blue).
	•	Completed → “Completed” (green).
	•	Cancelled / Rejected → “Cancelled” (grey/red).
	•	Internal mapping is flexible but must be consistent across Home and Maintenance screens.

10.3 Behaviour
	•	Ordering:
	•	Show most recent requests first (by RequestedAt or latest status change).
	•	Tapping row or “View details”:
	•	Opens Maintenance Request Detail screen (timeline, assessment, approvals, rating).

10.4 Empty state
	•	If user has no maintenance requests:
	•	Show text: “No requests yet”.
	•	Show CTA: “Create request” → opens Maintenance Request creation flow.

⸻

11. Community Feeds

11.1 Content
	•	Section header: “Community Feeds”.
	•	Right-aligned link: “View all”.
	•	Post cards (1–2 visible items) with:
	•	Author avatar and name/role (e.g., “Security”).
	•	Timestamp (“10 minutes ago”).
	•	Post text (announcement, update, note) truncated after a few lines.
	•	Interaction row:
	•	Like icon + like count.
	•	Comment icon + comment count.
	•	Optional share icon.
	•	Text summary (e.g., “You and 10 others liked this”) when applicable.

11.2 Behaviour
	•	Tapping “View all”:
	•	Navigates to full Community Feed screen (or selects Community tab).
	•	Fires analytics: home_feed_view_all_clicked.
	•	Tapping a post card:
	•	Opens Post Detail view (full text + comments).
	•	Liking / unliking:
	•	Updates UI counts optimistically.
	•	Fires analytics: feed_post_liked (postId).

11.3 Empty state
	•	If no posts are available:
	•	Show friendly message, e.g., “No recent updates”.
	•	Do not show empty cards.

11.4 Feature flags
	•	If Community Feed is disabled for a tenant:
	•	Hide the entire section.

⸻

12. Promotional Banner (Campaign)

12.1 Content
	•	Full-width coloured banner (e.g., purple) with image and copy.
	•	Example: “Weekend Special – Tandoori Nights Special, Flat 20% OFF”.
	•	Primary button, e.g., “Order Now”.

12.2 Behaviour
	•	Data-driven from backend (campaigns).
	•	If there is an active banner campaign:
	•	Render banner between Community Feeds and Featured For You.
	•	Tapping anywhere on the banner or on the CTA:
	•	Opens linked campaign destination (e.g., partner ordering screen, webview).
	•	Fire analytics: promo_banner_clicked (campaignId, tenantId).
	•	If no active campaign:
	•	Hide this section.

12.3 Consent / ads
	•	When ads/personalization consent is OFF:
	•	Only show non-personalized or community-service banners, or hide altogether based on configuration.

⸻

13. Featured For You Carousel

13.1 Content
	•	Section title: “FEATURED FOR YOU”.
	•	Horizontally scrollable cards with:
	•	Background image (e.g., property / destination).
	•	Short title/subtitle.
	•	Button (e.g., “Book Now”).

13.2 Behaviour
	•	Cards fetched from backend “featured offers” feed.
	•	Horizontal swipe to browse multiple cards.
	•	Tapping a card or its CTA:
	•	Opens offer detail or booking screen.
	•	Analytics: featured_offer_clicked (offerId, tenantId).
	•	If there are fewer than N cards:
	•	Show only available ones; still allow swipe.
	•	If no offers or feature disabled:
	•	Hide entire section.

13.3 Consent / ads
	•	Same rules as Promotional Banner (respect analytics + ads/personalization consent).

⸻

14. Bottom Navigation Bar

14.1 Tabs
	•	Home (current screen; highlighted).
	•	Facility.
	•	Services.
	•	Community.

14.2 Behaviour
	•	Tab bar is persistent across Resident App Shell.
	•	Home is the default tab when user first enters the shell.
	•	Each tab maintains its own navigation stack where possible (standard mobile behaviour).

⸻

15. States, Errors, and Edge Cases

15.1 Loading
	•	On first entry to Home:
	•	Show skeletons/placeholders for sections while data is loading.
	•	Sections load independently:
	•	Visitors, Requests, Feeds, Banner, Offers can all complete at different times.

15.2 Errors
	•	If a section fails to load:
	•	Show inline error (“Unable to load. Tap to retry.”) in that section only.
	•	No global blocking error unless the entire app shell fails.
	•	Retry tapping triggers only that section’s reload.

15.3 Feature availability
	•	Sections may be disabled per tenant by configuration:
	•	Community Feeds, Promotional Banner, Featured For You.
	•	When disabled, they are not rendered at all.
	•	When enabled but with no data:
	•	Show simple empty states rather than hiding (except for explicitly ad-only sections).

15.4 Token expiry / auth failure
	•	If an API call from Home returns unauthorized:
	•	Show short message.
	•	Redirect user to Sign In screen.
	•	On successful login:
	•	Reload Home for the current tenant.

15.5 Tenant switch
	•	On tenant change:
	•	Clear cached data for the previous tenant.
	•	Reload all Home sections using new tenantId.

⸻

16. Analytics & Events (Summary)

Minimum events (in addition to onboarding events):
	•	home_viewed
	•	home_quick_action_clicked (with action)
	•	bill_pay_cta_clicked
	•	home_visitors_view_all_clicked
	•	home_requests_view_all_clicked
	•	home_feed_view_all_clicked
	•	feed_post_opened
	•	feed_post_liked
	•	promo_banner_clicked
	•	featured_offer_clicked

All analytics must respect the consent flags defined in UserOnboardingFlow:
	•	If analytics consent is OFF → limit events to what is strictly required for app operation / security, not marketing.

⸻

17. Non-Functional Requirements

	•	Home should render initial content within acceptable time (product to define SLA) on typical 4G/Wi-Fi.
	•	UI must be responsive for common phone sizes and platforms (iOS/Android).
	•	Basic accessibility:
	•	Sufficient contrast for text and status pills.
	•	Tap targets meet platform minimums.
	•	Support dark mode if app supports it globally (colours aligned with design system).

