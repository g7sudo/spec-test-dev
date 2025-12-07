/**************************************************
 * ENUMS – ADS / CAMPAIGNS
 **************************************************/

Enum CampaignType {
  Banner       // standard banner placements
  Story        // WhatsApp/Instagram-style story campaigns
}

Enum CampaignStatus {
  Draft
  Active
  Paused
  Ended
}

Enum CreativeType {
  Banner       // single banner creative
  StorySlide   // one slide in a multi-slide story
}

Enum AdPlacement {
  HomeTop
  HomeMiddle
  HomeBottom
  StoryFeed    // story tray / story viewer
  VisitorsFlow // e.g. visitor screen (future use)
}

Enum CTAType {
  None
  Call
  WhatsApp
  Link         // generic URL / deep link
}

Enum AdEventType {
  View         // counted when view threshold is met
  Click        // CTA tapped
}

/**************************************************
 * TABLES – ADS / CAMPAIGNS (PLATFORM-LEVEL)
 **************************************************/

Table Advertiser {
  Id             uuid        [pk]
  Version        int         [not null, default: 1]
  IsActive       bool        [not null, default: true]

  CreatedAt      timestamptz [not null, default: `now()`]
  CreatedBy      uuid        [default: null, ref: > PlatformUser.Id]
  UpdatedAt      timestamptz [default: null]
  UpdatedBy      uuid        [default: null, ref: > PlatformUser.Id]

  Name           text        [not null, note: 'Business / brand name']
  ContactName    text        [default: null]
  ContactEmail   text        [default: null]
  ContactPhone   text        [default: null]
  Notes          text        [default: null]

  Note: 'Represents a paying advertiser or local business on the platform.'
}

Table Campaign {
  Id                 uuid           [pk]
  Version            int            [not null, default: 1]
  IsActive           bool           [not null, default: true]

  CreatedAt          timestamptz    [not null, default: `now()`]
  CreatedBy          uuid           [default: null, ref: > PlatformUser.Id]
  UpdatedAt          timestamptz    [default: null]
  UpdatedBy          uuid           [default: null, ref: > PlatformUser.Id]

  AdvertiserId       uuid           [not null, ref: > Advertiser.Id]
  Name               text           [not null]
  Type               CampaignType   [not null] // Banner or Story
  Status             CampaignStatus [not null, default: 'Draft']

  StartsAt           timestamptz    [not null]
  EndsAt             timestamptz    [default: null]

  MaxImpressions     int            [default: null, note: 'Optional hard cap']
  MaxClicks          int            [default: null, note: 'Optional hard cap']
  DailyImpressionCap int            [default: null, note: 'Optional per-day cap per campaign']
  Priority           int            [not null, default: 0, note: 'Higher = served first among eligible campaigns']

  Notes              text           [default: null]

  Note: 'Logical campaign; creatives + targeting + status are driven from here.'
}

Table CampaignTargetTenant {
  Id             uuid        [pk]
  Version        int         [not null, default: 1]
  IsActive       bool        [not null, default: true]

  CreatedAt      timestamptz [not null, default: `now()`]
  CreatedBy      uuid        [default: null, ref: > PlatformUser.Id]
  UpdatedAt      timestamptz [default: null]
  UpdatedBy      uuid        [default: null, ref: > PlatformUser.Id]

  CampaignId     uuid        [not null, ref: > Campaign.Id]
  TenantId       uuid        [not null, ref: > Tenant.Id]

  Note: 'Many-to-many link: which tenants (communities) this campaign runs in.'
}

/**************************************************
 * CREATIVES – BANNERS & STORIES
 **************************************************/

Table CampaignCreative {
  Id             uuid          [pk]
  Version        int           [not null, default: 1]
  IsActive       bool          [not null, default: true]

  CreatedAt      timestamptz   [not null, default: `now()`]
  CreatedBy      uuid          [default: null, ref: > PlatformUser.Id]
  UpdatedAt      timestamptz   [default: null]
  UpdatedBy      uuid          [default: null, ref: > PlatformUser.Id]

  CampaignId     uuid          [not null, ref: > Campaign.Id]
  Type           CreativeType  [not null]      // Banner or StorySlide

  // Banner-specific fields
  Placement      AdPlacement   [default: null, note: 'Where this creative can be shown (for banner type)']
  SizeCode       text          [default: null, note: 'Logical size key e.g. HOME_LARGE, HOME_SMALL']

  // Story-specific fields
  Sequence       int           [default: null, note: 'Ordering for story slides (1..n)']

  // Shared fields
  MediaUrl       text          [not null]. //image or short video clip for 10-20sec
  Caption        text          [default: null]

  CTAType        CTAType       [not null, default: 'None']
  CTAValue       text          [default: null, note: 'Phone, WhatsApp deeplink, or URL depending on CTAType']

  Note: 'One row per creative asset: banner variant or story slide. A Story campaign will have multiple StorySlide creatives with Sequence set.'
}

/**************************************************
 * EVENTS – IMPRESSIONS & CLICKS
 **************************************************/

Table AdEvent {
  Id             uuid          [pk]
  Version        int           [not null, default: 1]
  IsActive       bool          [not null, default: true]

  CreatedAt      timestamptz   [not null, default: `now()`]
  CreatedBy      uuid          [default: null, ref: > PlatformUser.Id] // usually null; system-generated
  UpdatedAt      timestamptz   [default: null]
  UpdatedBy      uuid          [default: null, ref: > PlatformUser.Id]

  CampaignId     uuid          [not null, ref: > Campaign.Id]
  CreativeId     uuid          [not null, ref: > CampaignCreative.Id]

  TenantId       uuid          [not null, ref: > Tenant.Id]
  PlatformUserId uuid          [default: null, ref: > PlatformUser.Id, note: 'Optional; filled if user is logged in']

  EventType      AdEventType   [not null]   // View or Click
  OccurredAt     timestamptz   [not null, default: `now()`]

  Screen         text          [default: null, note: 'e.g. HOME, STORY_VIEWER']
  Placement      AdPlacement   [default: null, note: 'Placement at time of event; useful for A/B']

  Note: 'Raw event log for analytics. View events are only recorded after the frontend confirms view-time threshold is met.'
}


no community admin in the loop.

I’ll lay out the full journeys for the 3 real personas:
	1.	Platform Admin (you / Savi operator)
	2.	Advertiser (local business / brand)
	3.	Resident (mobile user)

No community admin anywhere.

⸻

1. Platform Admin Journey

This persona owns everything: onboarding advertisers, creating campaigns, selecting tenants, and reading analytics.

1.1. Set up the ad system (one-time-ish)
	1.	Log in to Platform Admin Portal
	•	Role: PlatformAdmin (already exists in your platform side).
	2.	Configure basics
	•	Turn on: “Ads enabled” per tenant.
	•	Define placements:
	•	HomeTop, HomeMiddle, HomeBottom, StoryFeed.
	•	Define view rule (for impressions):
	•	e.g. “Count impression when banner/story is visible ≥ 1 second and ≥ 50% of height.”
	3.	Optionally define limits
	•	Max concurrent campaigns per tenant.
	•	Max campaigns per advertiser.
	•	Default priority rules (which campaign wins if multiple match).

⸻

1.2. Onboard an Advertiser

This can be done after a phone call / WhatsApp / email with the business – they don’t need portal access in v1.
	1.	Go to Monetization → Advertisers → New Advertiser.
	2.	Fill:
	•	Business Name: “XYZ Laundry Services”.
	•	Contact person, phone, email.
	•	Notes: “Prefers 30-day campaigns, WhatsApp as primary CTA”.
	3.	Save → Advertiser record created.

(In a later phase you can give them login, but v1 can be fully admin-driven.)

⸻

1.3. Create a Campaign (Banners or Stories)

Same base flow, only creatives differ.

Step 1 – Campaign basics
	1.	Monetization → Campaigns → New Campaign.
	2.	Fill:
	•	Advertiser: “XYZ Laundry Services”.
	•	Name: “Monsoon Laundry Offer”.
	•	Type: Banner or Story.
	•	Start & End dates (e.g. 1 to 30 June).
	•	Status: start as Draft.

Step 2 – Target tenants
	1.	Select TargetTenants:
	•	Multi-select list of communities:
	•	Example: “Green Meadows”, “Palm Residency”, “Skyline Towers”.
	•	All stored in CampaignTargetTenant.
	2.	Optionally:
	•	Set Priority (to resolve conflicts).
	•	Set MaxImpressions / DailyImpressionCap if needed.

Step 3A – Add banner creatives (if Type = Banner)
For each banner slot/size you want to support:
	1.	Click Add Banner Creative.
	2.	Choose:
	•	Placement: HomeTop or HomeMiddle.
	•	SizeCode: e.g. HOME_LARGE, HOME_MEDIUM.
	3.	Upload promo image (correct ratio for that placement).
	4.	Configure CTA:
	•	CTAType: WhatsApp / Call / Link.
	•	CTAValue: phone number, wa.me link, or URL.
	5.	Repeat for other placements if needed.

Each one becomes a CampaignCreative row with Type = Banner.

Step 3B – Add story creatives (if Type = Story)
Here you model the “company image with 5–6 stories”.
	1.	Click Add Story Slide for each slide:
	•	Sequence = 1: brand cover slide.
	•	Sequence = 2–6: offer details / variants.
	2.	For each slide:
	•	Upload full-screen story image.
	•	Optional caption (short text overlay).
	•	CTA: typically same across all (e.g. WhatsApp).
	3.	Save.

Each slide is CampaignCreative with:
	•	Type = StorySlide
	•	Sequence = 1..n.

Step 4 – Review & activate
	1.	Preview:
	•	Banner preview in fake home screen.
	•	Story preview as a story reel.
	2.	Set Status = Active.
	3.	Campaign is now eligible for all its TargetTenants.

⸻

1.4. During campaign: serving + tracking

This is “behind the scenes”, but it’s still part of the admin’s mental model.
	1.	Mobile app opens (per tenant):
	•	App calls: GET /ads?tenantId=...&placement=HomeTop or GET /ads/stories?tenantId=....
	2.	Backend selects creatives:
	•	Find all Campaign where:
	•	Status = Active
	•	Start <= now <= End
	•	TenantId in CampaignTargetTenant
	•	Apply priority / caps.
	•	Return matching CampaignCreative objects.
	3.	App renders ads:
	•	Banners on home screen.
	•	Story reel in “Offers / Promotions” story tray.
	4.	View → impression:
	•	App tracks visibility (view threshold).
	•	When threshold met:
	•	Calls API: POST /ads/events with EventType = View, CampaignId, CreativeId, TenantId, (optional) UserId.
	•	Backend writes AdEvent row.
	•	This is the impression.
	5.	Click:
	•	When user taps CTA:
	•	App calls POST /ads/events with EventType = Click.
	•	Backend logs AdEvent row.
	•	Then app opens WhatsApp / dialer / browser.

⸻

1.5. After / during campaign: analytics & decisions
	1.	Platform Admin opens Campaign Detail.
	2.	Sees aggregated statistics per campaign:
	•	Total impressions, total clicks, CTR.
	•	Breakdown by tenant.
	•	Breakdown by placement (e.g. HomeTop vs StoryFeed).
	3.	Uses this to:
	•	Report performance to advertiser.
	•	Decide renewal or new campaign.
	•	Optimize placements (maybe you learn that story campaigns perform better).

⸻


1. Resident Journey (Mobile App User)

These are the people seeing the banners & stories.

3.1. Normal app use
	1.	Resident opens app → authenticates (as today).
	2.	Tenant context is already known from login (Unit / Community).
	3.	They land on Home Screen.

⸻

3.2. Seeing banner promotions
	1.	On home screen:
	•	Among usual cards (visitors, maintenance, etc.), they see:
	•	A banner at HomeTop or HomeMiddle.
	•	Example banner:
	•	“20% OFF at XYZ Laundry – Residents Only”
	•	CTA button: “WhatsApp Now”.
	2.	Behind the scenes:
	•	As the banner is visible long enough, app fires “view” event → impression logged.
	3.	When they tap the CTA:
	•	App sends “click” event.
	•	Then:
	•	Opens WhatsApp chat with business, or
	•	Opens phone dialer, or
	•	Opens browser link.

⸻

3.3. Seeing story-style offers
	1.	Top of home screen (or dedicated tab) has a story tray:
	•	Circles like:
	•	[Offers], [Local Deals] etc.
	2.	Resident taps Offers story.
	3.	The app loads story slides from Story campaigns for that tenant:
	•	Slide 1: brand cover.
	•	Slide 2–6: different offers / messages.
	4.	While resident browses story:
	•	When each slide is in view long enough → View event logged.
	•	If they tap CTA on any slide → Click event logged.
	5.	Resident leaves story viewer:
	•	Returns to normal app flows (visitors, payments, etc.).

⸻

3.4. Expected experience
	•	Ads/promos feel like local offers, not random AdMob spam.
	•	They:
	•	See relevant deals.
	•	Tap when they are interested.
	•	Otherwise, continue using the app as usual.

⸻

4. Personas Summary (No Community Admin)

Platform Admin
	•	Owns advertisers & campaigns.
	•	Picks target tenants.
	•	Uploads creatives.
	•	Approves, activates, pauses.
	•	Reads analytics and shares performance with advertisers.

Advertiser
	•	Deals only with Platform Admin (offline/WhatsApp/email).
	•	Provides brand details + creatives.
	•	Receives performance reports.
	•	Pays you based on agreed pricing.

Resident
	•	Sees banners on home screen.
	•	Sees story-style offers in a story tray.
	•	Their views/clicks drive your impression/click metrics.

⸻



I’ll walk through:
	1.	What the app does step-by-step (banners + stories)
	2.	What network calls it makes
	3.	What events it sends for impressions & clicks

So you can design the backend APIs + logic around it.

⸻

1. Assumptions (mobile side + your stack)
	•	App is React Native (Expo).
	•	User is already authenticated, so app knows:
	•	tenantId (community)
	•	userId (platform user id, optional but nice for analytics)
	•	All ad decisions happen in Platform API, not per-tenant API.

We’ll keep it super simple: no SDK, just 3 main endpoints:
	•	GET /ads/banners
	•	GET /ads/stories
	•	POST /ads/events (for views & clicks)

⸻

1. When the Home Screen Opens (BANNERS)

Think of this as the “banner path”.

1.1 Request banners for this tenant & screen

When the Home screen is mounted:
	1.	App knows:
	•	tenantId
	•	screen = "HOME"
	•	placements it wants to fill, e.g. ["HomeTop", "HomeMiddle"].
	2.	It calls something like:

GET /ads/banners?tenantId={tenantId}&screen=HOME&placements=HomeTop,HomeMiddle
Authorization: Bearer {JWT}

Backend behavior:
	•	Reads tenantId from query or from token/header.
	•	Finds active campaigns for that tenant where:
	•	Status = Active
	•	StartsAt <= now <= EndsAt
	•	Campaign type = Banner
	•	Filters creatives by Placement IN (HomeTop, HomeMiddle).
	•	Applies:
	•	Priority rules
	•	Caps (MaxImpressions / DailyImpressionCap) if you implement them.
	•	Returns list of creatives.

Response (example):

{
  "tenantId": "TNT-123",
  "screen": "HOME",
  "placements": [
    {
      "placement": "HomeTop",
      "creative": {
        "creativeId": "CR-001",
        "campaignId": "CMP-001",
        "type": "Banner",
        "imageUrl": "https://cdn.savi.app/ads/cmp001-top.png",
        "ctaType": "WhatsApp",
        "ctaValue": "https://wa.me/971500000000",
        "analyticsToken": "xyz123"  // optional, for anti-fraud later
      }
    },
    {
      "placement": "HomeMiddle",
      "creative": {
        "creativeId": "CR-002",
        "campaignId": "CMP-001",
        "type": "Banner",
        "imageUrl": "https://cdn.savi.app/ads/cmp001-mid.png",
        "ctaType": "Link",
        "ctaValue": "https://xyz-laundry.com/offer",
        "analyticsToken": "xyz124"
      }
    }
  ]
}

App then renders these banners in the Home UI.

⸻

1.2 Tracking views (impressions) for banners

On the client side, we define a simple rule:

A banner impression is counted when the banner is
at least 50% visible on screen for ≥ 1 second.

In React Native, you’ll:
	•	Use scroll / visibility detection (e.g. onViewableItemsChanged in FlatList or intersection-style logic).
	•	When a banner enters the viewport:
	•	Start a timer.
	•	If it stays visible for 1 second:
	•	Mark it as viewed (to avoid double counting).
	•	Add a “view event” into a local queue.

The app does NOT call the API every single time immediately – better to batch.

Batch view event payload (example):

POST /ads/events
Authorization: Bearer {JWT}

{
  "events": [
    {
      "campaignId": "CMP-001",
      "creativeId": "CR-001",
      "tenantId": "TNT-123",
      "userId": "USR-555",
      "eventType": "View",
      "screen": "HOME",
      "placement": "HomeTop",
      "occurredAt": "2025-12-07T18:20:01Z"
    }
  ]
}

Backend:
	•	Inserts rows into AdEvent table.
	•	Optionally:
	•	Applies dedupe (e.g. ignore repeated views within X minutes for same user & creative).
	•	Updates aggregated counters in a separate table or background job.

You can choose to accept per-event or batch up to N events – I’d design API for batch from day one.

⸻

1.3 Tracking clicks on banners

When user taps the banner or CTA button:
	1.	App first sends a click event:

POST /ads/events

{
  "events": [
    {
      "campaignId": "CMP-001",
      "creativeId": "CR-001",
      "tenantId": "TNT-123",
      "userId": "USR-555",
      "eventType": "Click",
      "screen": "HOME",
      "placement": "HomeTop",
      "occurredAt": "2025-12-07T18:20:10Z"
    }
  ]
}

	2.	After the request is fired (no need to wait for response, just fire & forget with retry), app:
	•	Opens WhatsApp / dialer / browser based on ctaType.

Backend simply:
	•	Logs event as Click.
	•	Later you can compute CTR = Clicks / Views.

⸻

2. When User Opens Offers / Stories (STORIES)

Now the story path: WhatsApp/Instagram-style.

2.1 Showing “Offers” entry point

On the home screen, you might have a story bubble like “Offers”.

You have two options for when to load story data:
	•	Option A (simple):
Only fetch story campaigns when user taps the “Offers” bubble.
	•	Option B (richer UX):
Prefetch on home load to show “New offers” etc.

Let’s start with Option A (simpler, good v1).

2.2 Fetch story campaigns when user taps “Offers”

When the user taps Offers:

GET /ads/stories?tenantId={tenantId}
Authorization: Bearer {JWT}

Backend:
	•	Finds Campaign where:
	•	Type = Story
	•	Status = Active
	•	In date range.
	•	CampaignTargetTenant includes this tenantId.
	•	Gets all StorySlide creatives for those campaigns.
	•	Sorts each campaign’s slides by Sequence.

Response (grouped by campaign):

{
  "tenantId": "TNT-123",
  "campaigns": [
    {
      "campaignId": "CMP-010",
      "name": "XYZ Laundry Monsoon Story",
      "slides": [
        {
          "creativeId": "CR-100",
          "sequence": 1,
          "imageUrl": "https://cdn/ads/cmp010-slide1.png",
          "caption": "Welcome to XYZ Laundry",
          "ctaType": "WhatsApp",
          "ctaValue": "https://wa.me/971500000000"
        },
        {
          "creativeId": "CR-101",
          "sequence": 2,
          "imageUrl": "https://cdn/ads/cmp010-slide2.png",
          "caption": "20% Off This Week",
          "ctaType": "WhatsApp",
          "ctaValue": "https://wa.me/971500000000"
        }
      ]
    }
  ]
}

The app then launches a story viewer UI with campaigns and slides.

⸻

2.3 Tracking story impressions (slide views)

Here the rule is similar, but you track per slide:

A story slide impression =
slide is the active slide in the story viewer for ≥ 1 second.

Flow:
	1.	User is viewing stories, starting at first slide of first campaign.
	2.	For each slide:
	•	When slide becomes active:
	•	Start a timer.
	•	If still active after 1 second, mark slide as viewed once this session.
	3.	Add a view event to queue:

{
  "campaignId": "CMP-010",
  "creativeId": "CR-100",
  "tenantId": "TNT-123",
  "userId": "USR-555",
  "eventType": "View",
  "screen": "OFFERS_STORIES",
  "placement": "StoryFeed",
  "occurredAt": "2025-12-07T18:25:01Z"
}

	4.	Send batched POST /ads/events periodically or when viewer closes.

Backend stores as AdEvent rows.

⸻

2.4 Tracking story clicks

There are two obvious click points:
	•	Tap anywhere on the slide (if you want entire slide to be clickable).
	•	Tap explicit CTA (button/icon).

Either way, when a click happens:
	1.	Add a click event to queue:

{
  "campaignId": "CMP-010",
  "creativeId": "CR-101",
  "tenantId": "TNT-123",
  "userId": "USR-555",
  "eventType": "Click",
  "screen": "OFFERS_STORIES",
  "placement": "StoryFeed",
  "occurredAt": "2025-12-07T18:25:15Z"
}

	2.	Send through POST /ads/events (batch).
	3.	App then performs the CTA (WhatsApp, call, link).

Backend logs these as clicks.

⸻

3. Event API Design (Backend-Oriented View)

Here’s a clean, backend-friendly shape for the events endpoint.

3.1 Endpoint

POST /ads/events
Authorization: Bearer {JWT}
Content-Type: application/json

3.2 Request body

{
  "events": [
    {
      "campaignId": "uuid",
      "creativeId": "uuid",
      "tenantId": "uuid",
      "userId": "uuid or null",
      "eventType": "View",         // or "Click"
      "screen": "HOME",            // or "OFFERS_STORIES", etc.
      "placement": "HomeTop",      // or "StoryFeed"
      "occurredAt": "2025-12-07T18:20:01Z"
    }
  ]
}

3.3 Backend behavior

For each event:
	•	Validate:
	•	campaignId + creativeId exist and are linked.
	•	tenantId is allowed for that campaign (defensive).
	•	Insert into AdEvent table.
	•	Optionally:
	•	De-duplicate based on (userId, creativeId, EventType, date/time window).
	•	Push to queue/stream for async aggregation.

Return:

{
  "status": "ok",
  "accepted": 5,
  "rejected": 0
}

If you need per-event status, you can add an array of statuses.

⸻

4. Summary: How This Guides Backend Design

From this mobile behavior you can now design backend like:
	1.	Selection endpoints
	•	GET /ads/banners?tenantId=&screen=&placements=
	•	GET /ads/stories?tenantId=
	2.	Tracking endpoint
	•	POST /ads/events (batch view/click).
	3.	Server logic
	•	Filter campaigns by:
	•	Type, status, dates, tenant.
	•	Choose creatives per placement.
	•	Return minimal info: image + CTA + IDs.
	•	Store events into AdEvent with fields we defined in DBML.
