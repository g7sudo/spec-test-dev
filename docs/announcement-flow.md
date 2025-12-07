Community Announcements Module

0. Scope

Module: Community Announcements
Tenant: Single community (per tenant DB)

In scope:
	•	Admin-created Announcements (no general community feed/posts).
	•	Targeting by Community / Block / Unit / RoleGroup (existing AnnouncementAudience).
	•	Lifecycle: Draft → Scheduled → Published → Archived.
	•	Optional event-style announcements (start/end, location).
	•	Resident likes / comments / read/unread (based on existing flags).
	•	Image support for announcements:
	•	Admin can attach one or more images.
	•	Residents see images inline / gallery style.

Out of scope:
	•	Generic “social feed” / community posts.
	•	Marketplace listings.
	•	Full calendar module (beyond add-to-calendar button).
	•	File upload low-level mechanics (reuses global Document / blob storage design).

⸻

1. Personas
	1.	Community Admin / Staff (Web/Admin Portal)
	•	Creates, edits, schedules, and publishes announcements.
	•	Defines audience, priority, and behaviours.
	•	Attaches images (photos, posters, banners).
	•	Manages comments (moderation), pins/unpins, archives.
	2.	Resident / Owner (Mobile App, maybe web)
	•	Views relevant announcements (per unit & role).
	•	Sees announcement images (inline gallery).
	•	Optionally likes / comments (if enabled).
	•	For events: can add to calendar.

⸻

2. Data Notes (how images fit)

2.1 Announcement core (already in tenant DB)

Key concepts (summarised):
	•	Announcement
	•	Title, Body
	•	Category (General, Maintenance, Emergency, Event, …)
	•	Priority (Normal, Important, Critical)
	•	Status (Draft, Scheduled, Published, Archived)
	•	PublishedAt, ScheduledAt, ExpiresAt
	•	Display flags: IsPinned, IsBanner
	•	Behaviour flags: AllowLikes, AllowComments, AllowAddToCalendar
	•	Event fields: IsEvent, EventStartAt, EventEndAt, IsAllDay, EventLocationText, EventJoinUrl
	•	AnnouncementAudience
	•	Links Announcement → Community / Block / Unit / RoleGroup.
	•	AnnouncementLike, AnnouncementComment, AnnouncementRead
	•	Engagement + read/unread.

2.2 Images for announcements

We reuse the existing Document / blob-storage pattern:
	•	Each Document row:
	•	OwnerType = 'Announcement'
	•	OwnerId = Announcement.Id
	•	FileType / MimeType indicates image (e.g. image/jpeg, image/png).
	•	FileUrl points to blob storage.

Rules for this flow:
	•	An Announcement can have 0–N images.
	•	Images are ordered via a Document field (e.g. SortOrder) or upload order.
	•	First image can act as a cover/thumbnail in the list; all images show in detail.

No new tables/columns needed — this is purely usage & UX.

⸻

3. Admin Flows

A1. Announcement Dashboard

Entry: Admin Portal → Communications → Announcements

View:
	•	Table of announcements:
	•	Title
	•	Category
	•	Priority
	•	Status (Draft / Scheduled / Published / Archived)
	•	PublishedAt
	•	Audience (Community / Block / Unit / RoleGroup)
	•	HasImages? (optional icon if any image Documents exist)
	•	Filters:
	•	Status, Category, Priority
	•	Date range (PublishedAt / ScheduledAt)
	•	Audience Type (Community / Block / Unit / RoleGroup)

Actions:
	•	New Announcement
	•	Open (view/edit)
	•	Publish now / Archive
	•	Pin / Unpin
	•	View comments & likes
	•	See read stats

⸻

A2. Create a Simple Announcement (Publish Now)

Persona: Admin

Use case: “Water outage today 2–4pm”
	1.	Admin clicks New Announcement.
	2.	Basic fields:
	•	Title (required)
	•	Body (required)
	•	Category = Maintenance
	•	Priority = Important
	3.	Audience:
	•	TargetType = Community (whole community).
	4.	Behaviour:
	•	IsPinned: true/false (admin decides).
	•	IsBanner: false (true for very critical only).
	•	AllowLikes: false.
	•	AllowComments: false.
	•	AllowAddToCalendar: false.
	5.	Images (new behaviour):
	•	Section: “Images”
	•	Admin can:
	•	Click “Upload images” (0–N).
	•	Each upload becomes a Document:
	•	OwnerType = 'Announcement'
	•	OwnerId = Announcement.Id
	•	MimeType indicates image.
	•	Option to reorder (Set SortOrder).
	•	Option to remove an image.
	6.	Publishing:
	•	Status = Published.
	•	PublishedAt = now.
	•	Optional: “Send push notification to audience?” Yes/No.
	7.	Save.

Result:
	•	Announcement appears at top of resident Announcements list.
	•	If push enabled, residents get notification.
	•	In list:
	•	First image (if any) used as thumbnail.
	•	In detail:
	•	Full image gallery visible.

⸻

A3. Create & Schedule an Event Announcement (with images)

Persona: Admin

Use case: “Community Diwali Event next weekend” with poster image.
	1.	Admin clicks New Announcement.
	2.	Fill Basic details:
	•	Title: “Diwali Celebration – Community Hall”
	•	Body: agenda, details.
	•	Category = Event.
	•	Priority = Important.
	3.	Audience:
	•	Community (or selected Blocks).
	4.	Behaviour flags:
	•	IsPinned = true (stay on top until event).
	•	IsBanner = true (highlighted banner).
	•	AllowLikes = true (optional).
	•	AllowComments = true (residents ask questions).
	•	AllowAddToCalendar = true.
	5.	Event fields:
	•	IsEvent = true.
	•	EventStartAt / EventEndAt.
	•	IsAllDay (if applicable).
	•	EventLocationText = “Community Hall”.
	•	EventJoinUrl (optional, for virtual).
	6.	Images:
	•	Upload event poster / flyer as 1 or more images.
	•	First image acts as cover in list + banner artwork.
	7.	Publishing:
	•	Status = Scheduled.
	•	ScheduledAt = date/time (e.g. 2 days before event).
	•	ExpiresAt = EventEndAt + 1 day.
	•	Enable push at ScheduledAt.

Result:
	•	Before ScheduledAt: only visible in admin as Scheduled.
	•	At ScheduledAt:
	•	Status auto → Published.
	•	Announcement appears in app with cover image.
	•	Push notification fired (if enabled).
	•	Residents see event card with poster image and event details.

⸻

A4. Targeted Announcement (Block/Unit/RoleGroup)

Same flow as A2/A3 with Audience step:
	1.	In “Audience” section, admin chooses TargetType:
	•	Community
	•	Block – select one or more block IDs.
	•	Unit – select specific units.
	•	RoleGroup – e.g. Owners, Committee, etc.
	2.	System creates AnnouncementAudience rows accordingly.

Images behave the same — only audience filtering changes which residents see the announcement.

⸻

A5. Edit, Archive, Pin, Moderate

Edit:
	•	Admin can edit Draft or Scheduled announcements fully (content, audience, images).
	•	For Published:
	•	Policy choice:
	•	Allow minor edits (fix text, swap image).
	•	Or lock major properties (Category, Audience, etc.).
	•	Changing images:
	•	Admin can upload new images or remove old ones (update Document records).

Archive:
	•	Admin sets Status = Archived:
	•	Announcement removed from main resident list (or moved under “Past” section).
	•	Image Documents remain for history/audit.

Pin / Unpin:
	•	Toggle IsPinned from dashboard or detail.
	•	Pinned announcements with images still show with thumbnail at top.

Moderate comments:
	•	If AllowComments = true:
	•	Admin opens comments list.
	•	Can hide/delete comments as needed.
	•	If a post gets noisy or toxic:
	•	Set AllowComments = false to freeze thread.

⸻

4. Resident Flows

R1. Announcements List (with images)

Persona: Resident / Owner
Entry: App → Community → Announcements
	•	App fetches Published announcements where:
	•	Audience includes this user’s unit/role.
	•	Now is before ExpiresAt (if set) or within your retention window.

List behaviour:
	•	Pinned announcements on top.
	•	Then other published announcements sorted by PublishedAt (newest first).
	•	For each row:
	•	Category icon.
	•	Priority badge (for Important/Critical).
	•	Title.
	•	Time ago (“2 hours ago”).
	•	Thumbnail image:
	•	Use first attached image (if any).
	•	If none, show category icon only.
	•	Unread indicator (no AnnouncementRead yet).

User can tap a row to view details.

⸻

R2. Announcement Detail (images + engagement)

When resident opens an announcement:
	1.	System records AnnouncementRead for that AnnouncementId + CommunityUserId (if not already).
	2.	The detail screen shows:

Header:
	•	Title
	•	Category chip
	•	Priority (e.g. “Important” / “Critical”)
	•	PublishedAt (“Yesterday, 3:00 PM”)

Images:
	•	If 1 image:
	•	Display as full-width image at top.
	•	If multiple:
	•	Display as swipeable gallery or grid; tap to open viewer (zoom).
	•	Images come from Document where OwnerType = Announcement and OwnerId = this.Id.

Body:
	•	Body text with simple formatting.

Event section (if IsEvent = true):
	•	Date / time range
	•	Location
	•	Join link (if any)
	•	“Add to calendar” button (if AllowAddToCalendar = true).

Engagement section:
	•	If AllowLikes = true:
	•	Like/Unlike button with like count.
	•	If AllowComments = true:
	•	Comments list (most recent or chronological).
	•	Input area to add a comment.

⸻

R3. Likes & Comments

Likes:
	•	Tap Like:
	•	Creates AnnouncementLike (AnnouncementId + UserId).
	•	Tap again to Unlike:
	•	Deletes or marks that like inactive.
	•	Like count updated.

Comments:
	•	Comment list shows:
	•	Commenter name, timestamp, text.
	•	Resident can:
	•	Add a comment.
	•	Edit/delete their own comment (if allowed).
	•	Admin can moderate.

If AllowComments = false:
	•	Comments section hidden or disabled.

⸻

R4. Push Notifications & Read Status
	•	When an announcement is Published (or at ScheduledAt):
	•	If configured by admin, send push notification to target audience.
	•	Content: Title + short snippet, maybe priority icon.
	•	Tapping the notification:
	•	Opens Announcement Detail.
	•	Creates AnnouncementRead entry.

In list:
	•	Unread announcements highlighted:
	•	Bold title or “NEW” badge.
	•	Once read:
	•	Badge disappears; AnnouncementRead record stays for analytics.

⸻

5. Simple Flow Diagram (Admin & Resident with Images)

flowchart TD

  %% Admin Creates
  A1[Admin: New Announcement] --> A2[Set Title, Body,\nCategory, Priority]
  A2 --> A3[Set Audience\n(Community/Block/Unit/RoleGroup)]
  A3 --> A4[Upload Images\n(0..N Document rows)]
  A4 --> A5[Configure Behaviour\n(Pin, Banner, Likes, Comments, Event fields)]
  A5 --> A6{Publish Now or Schedule?}
  A6 -->|Now| A7[Status = Published,\nPublishedAt = now,\nOptional Push]
  A6 -->|Schedule| A8[Status = Scheduled,\nScheduledAt set]

  A8 --> A9[At ScheduledAt:\nStatus -> Published,\nOptional Push]

  %% Resident Views
  R1[Resident: Announcements List] --> R2[See cards with\nthumbnail image (if any)]
  R2 --> R3[Open Announcement Detail]
  R3 --> R4[Mark as Read\n(AnnouncementRead)]
  R3 --> R5[View Images Gallery\n(from Document rows)]
  R3 --> R6{Likes enabled?}
  R6 -->|Yes| R7[Like/Unlike\n(AnnouncementLike)]
  R3 --> R8{Comments enabled?}
  R8 -->|Yes| R9[View/Add Comments\n(AnnouncementComment)]

  %% Admin Management
  A7 --> M1[Admin: Edit/Pin/Archive\nModerate Comments,\nReplace Images]


⸻