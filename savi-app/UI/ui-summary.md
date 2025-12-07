1. Screen Overview

Primary screen: Home tab of a residential community app for a logged‑in resident.
Purpose: quick snapshot of dues, visitors, requests, community updates, and offers, with shortcuts into key flows.
Layout: vertically scrollable content; fixed bottom tab bar with 4 tabs: Home, Facility, Services, Community.
2. Home Screen Layout (Top → Bottom)

Status bar & app bar

Shows resident name/unit (e.g., “Block A‑001”) and city.
Left: resident avatar (tap opens profile / account settings).
Right: notification icon (tap opens notifications screen) and a secondary icon for more options.
Outstanding Bill Drawer (conditional banner)

Full‑width yellow gradient panel shown only when there are unpaid bills.
Content: bill type (e.g., “Electricity bill”), due date, short warning text, and primary button Pay Now.
Close/dismiss icon hides the drawer; the rest of the screen scrolls under it.
Tap Pay Now → navigate to bill payment flow with the selected bill pre‑loaded.
Household / Residents avatar strip

Horizontal list of circular avatars (family members / co‑residents).
Some avatars can display a “New” badge.
Tap avatar → open that person’s profile / details.
Quick Action Grid (2 x 3)

Tiles:
Pre-Register Visitor
Maintenance Request
Give Feedback
Book Facility
Emergency
Announcements
Each tile shows icon + label; tapping navigates to the respective feature.
Emergency should trigger the fastest path to configured emergency contacts / alert screen.
Announcements may show an unread indicator when new announcements exist.
My Visitors

Header: title My Visitors, right‑aligned View all link.
Content: horizontally swipeable visitor cards with:
Visitor name, flat they are visiting, scheduled date & time.
Small status indicator / avatar.
Page indicator dots below cards show position in the carousel.
Tap card → visitor details screen.
Tap View all → full visitors list.
Empty state: if there are no upcoming / recent visitors, show message (e.g., “No visitors yet”) and CTA to Pre-Register Visitor.
My Requests

Header: title My Requests.
Vertical list (2–3 latest items) of service/maintenance requests.
Each item shows:
Request title (e.g., “Leaking Bathroom Faucet”).
Date & time.
Service type (e.g., “Plumber”, “AC Tech”).
Status pill (e.g., Pending, Confirmed) with color coding.
View details link.
Tap card or View details → request detail screen.
Tap section header (or future View all) → full requests list.
Empty state: if no requests, show text like “No requests yet” and primary CTA Create request.
Community Feeds

Header: Community Feeds with right‑aligned View all.
Cards representing posts (e.g., from security, management, or residents) showing:
Author avatar and role.
Timestamp (e.g., “10 minutes ago”).
Post text, possibly multi-line (e.g., maintenance notices).
Interaction row: like, comment, share icons; like count; “Liked this” label when current user liked.
Tap card → post detail / comments view.
Tap View all → full community feed screen.
Empty state: show message like “No recent updates” when feed is empty.
Promotional Banner

Full‑width colored card (“Weekend Special – … 20% OFF”).
Primary CTA (e.g., Order Now) leading to partner service / offers detail.
Appears below community feed and above featured cards.
Featured For You Carousel

Section label Featured for you.
Horizontally scrollable cards (e.g., stay/booking offers) with image, short title, and Book Now button.
Tap card or Book Now → corresponding partner/booking flow.
Bottom Navigation Bar (Persistent)

Four tabs with icon + label:
Home (current screen; highlighted).
Facility (navigate to facility bookings/amenities).
Services (navigate to services marketplace/requests overview).
Community (navigate to full community feed / groups).
Tab switch replaces main content area; bottom bar stays fixed.
3. States and Variants (from home_all_state.png)

Due banner on/off

When there is at least one unpaid bill → show yellow due drawer at top.
When all bills are cleared or banner is dismissed → standard white header without drawer.
Section visibility rules

My Visitors section is shown when there is visitor data or an empty state; can collapse to “No visitors yet” message.
My Requests section is shown when user has requests or an empty state; statuses update per backend.
Community Feeds, Promotional banner, and Featured for you are optional but ordered exactly as in the layout; if any has no data, it is hidden.
Scrolling behavior

Entire content from avatar strip down is vertically scrollable.
Carousels (My Visitors, Featured for you) scroll horizontally within the vertical page.
Interaction feedback

Tapping any card or CTA triggers navigation; selections provide standard tap feedback.
Status pills and “New” badges are read‑only indicators, not clickable by themselves unless specified in design.
4. High-Level Flow Summary

App launches → Home tab is active.
If user has dues → show bill drawer; user can pay or dismiss.
User can:
Use quick actions for core tasks (visitor registration, maintenance, feedback, facility booking, emergency, announcements).
Review upcoming visitors and requests; drill down into details or to full lists.
Browse community updates and interact (like/comment/share).
Access offers and featured content via promotional and featured cards.
Switch to Facility, Services, or Community tabs via bottom navigation to continue related flows.
