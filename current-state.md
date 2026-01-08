Got it 👍
Here is a clean, absolute feature inventory for SAVI — no comparison, no marketing, no justification.

Legend:
	•	EXISTS → already designed & implemented in DB + API + flow
	•	PARTIAL → core exists but not complete end-to-end
	•	NOT STARTED → intentionally not built yet

⸻

SAVI – Feature Inventory (Current State)

1. Platform & Core

Authentication & Identity
	•	Firebase authentication (email / phone / OTP) — EXISTS
	•	PlatformUser (global identity) — EXISTS
	•	Multi-tenant membership (User ↔ Tenant) — EXISTS
	•	Multiple communities per user — EXISTS
	•	Tenant selection after login — EXISTS

Multi-Tenancy
	•	PlatformDB + TenantDB separation — EXISTS
	•	Database-per-tenant — EXISTS
	•	Tenant provisioning & migration — EXISTS
	•	Tenant context middleware — EXISTS

Roles & Permissions
	•	Global permission catalog — EXISTS
	•	Platform roles — EXISTS
	•	Tenant role groups — EXISTS
	•	Policy-based authorization — EXISTS
	•	Permission caching per tenant — EXISTS

⸻

2. Community Structure
	•	Blocks / Buildings — EXISTS
	•	Floors — EXISTS
	•	Units — EXISTS
	•	Unit types (1BHK, 2BHK, etc.) — EXISTS
	•	Parking slots inventory — EXISTS
	•	Parking allocation to units — EXISTS

⸻

3. Parties, Residents & Occupancy
	•	Party (canonical person/entity) — EXISTS
	•	Contacts & addresses for Party — EXISTS
	•	Lease — EXISTS
	•	LeaseParty (roles per lease) — EXISTS
	•	Ownership vs Residency separation — EXISTS
	•	CommunityUser (app account per tenant) — EXISTS
	•	Invite resident / co-resident — EXISTS
	•	Accept invite & link to Party — EXISTS
	•	End residency / lease expiry handling — EXISTS

⸻

4. Visitor Management (Security)
	•	Visitor pre-registration by residents — EXISTS
	•	Walk-in visitor entry by security — EXISTS
	•	Unit-based visitor approval — EXISTS
	•	Push notification to residents — EXISTS
	•	Visitor entry status tracking — EXISTS
	•	Delivery / purpose tagging — EXISTS
	•	Security guard roles — EXISTS

⸻

5. Announcements & Communication
	•	Announcements — EXISTS
	•	Categories / guidelines — EXISTS
	•	Broadcast to all residents — EXISTS
	•	Push notifications — EXISTS
	•	Announcement attachments — EXISTS

⸻

6. Maintenance & Helpdesk
	•	Maintenance request creation — EXISTS
	•	Request lifecycle (open → assigned → closed) — EXISTS
	•	Maintenance roles (manager, staff) — EXISTS
	•	Assignment to staff — EXISTS
	•	Status updates & comments — EXISTS
	•	Photo uploads — EXISTS
	•	SLA / cost approval — PARTIAL
	•	Configurable request forms — PARTIAL

⸻

7. Amenities & Bookings
	•	Amenity definition — EXISTS
	•	Amenity booking request — EXISTS
	•	Approval / rejection flow — EXISTS
	•	Time-slot booking — EXISTS
	•	Resident notifications — EXISTS
	•	Events (non-amenity) — NOT STARTED

⸻

8. Files & Documents
	•	File upload (temporary) — EXISTS
	•	File attach to entity — EXISTS
	•	Azure Blob storage — EXISTS
	•	Manual cleanup endpoint — EXISTS
	•	Document ownership model — EXISTS

⸻

9. User Profile & Preferences
	•	My profile (tenant-specific) — EXISTS
	•	Update profile — EXISTS
	•	Privacy settings — EXISTS
	•	Notification preferences — EXISTS

⸻

10. Background Jobs & Notifications
	•	Background job infrastructure (Hangfire) — EXISTS
	•	Push notification service (FCM) — EXISTS
	•	Tenant-aware jobs — EXISTS
	•	Scheduled cleanup / automation — EXISTS

⸻

11. Administration (Tenant Level)
	•	Community admin onboarding — EXISTS
	•	Resident invitations — EXISTS
	•	Parking management — EXISTS
	•	Staff role assignment — EXISTS
	•	Asset & inventory management — NOT STARTED
	•	Violation tracking — NOT STARTED

⸻

12. Platform Administration
	•	Tenant creation — EXISTS
	•	Tenant status & lifecycle — EXISTS
	•	Plan & feature flags — EXISTS
	•	Platform user management — EXISTS
	•	Platform audits — EXISTS

⸻

13. Payments & Accounting
	•	Maintenance billing — NOT STARTED
	•	Utility billing — NOT STARTED
	•	Online payments — NOT STARTED
	•	Accounting / reconciliation — NOT STARTED
	•	Financial reports — NOT STARTED

⸻

14. Marketplace & Social
	•	Community posts — NOT STARTED
	•	Polls — NOT STARTED
	•	Albums — NOT STARTED
	•	Buy / Sell / Giveaway — NOT STARTED
	•	Chat / messaging — NOT STARTED

⸻

15. Emergency & Safety
	•	Emergency alert / panic button — NOT STARTED
	•	Neighbor / security broadcast — NOT STARTED

⸻

16. IoT & Hardware
	•	Gate hardware integration — NOT STARTED
	•	Vehicle access systems — NOT STARTED
	•	IoT staff tracking — NOT STARTED

⸻

Final Summary
	•	Core platform & community operations: COMPLETE
	•	Visitor, announcements, maintenance, amenities: COMPLETE / near-complete
	•	Billing, social, marketplace, IoT: intentionally not started

