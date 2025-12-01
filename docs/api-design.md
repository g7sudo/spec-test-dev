Alright, here’s the updated full blueprint (v3) with all your feedback integrated, end-to-end in one place.
You can treat this as the current source of truth for the SAVI backend.

⸻

SAVI Backend Architecture Blueprint – v3

1. Scope & Goals

Product: SAVI – a multi-tenant SaaS for residential community management.

User groups:
	•	Platform / root team (you + staff)
	•	Community admins / community managers
	•	Residents & owners
	•	Maintenance team
	•	Security team

Principles:
	•	DB-per-tenant isolation
	•	Strong RBAC
	•	Swappable infrastructure (auth, jobs, cache, storage)
	•	Enterprise-grade auditing, logging, and observability

⸻

2. High-Level Architecture

2.1 Runtime architecture
	•	Single ASP.NET Core Web API (“SAVI API”)
	•	Two logical DB layers:
	•	PlatformDB (shared)
	•	TenantDB (one per community)
	•	Frontends:
	•	Web app (Platform admin + Community admin, same app, different permissions)
	•	Mobile apps:
	•	Residents & Owners (combined app)
	•	Maintenance
	•	Security

2.2 Technology stack
	•	Backend: ASP.NET Core Web API (.NET)
	•	ORM: Entity Framework Core + Migrations
	•	Databases:
	•	Dev: SQLite allowed
	•	Prod: PostgreSQL or SQL Server (decision later, design supports both)
	•	Pattern: DB-per-tenant + one shared PlatformDB
	•	Auth: Firebase Authentication (OAuth 2.0 / ID tokens) via IAuthService
	•	Push Notifications: Firebase Cloud Messaging via IPushNotificationService
	•	Auditing: Audit.NET
	•	Background Jobs: Hangfire via IBackgroundJobScheduler
	•	Caching: ITenantCache abstraction
	•	Implementation v1: IMemoryCache
	•	Future: Redis
	•	File Storage: Azure Blob Storage via IFileStorageService
	•	Logging: ASP.NET logging + Serilog
	•	Tracing: OpenTelemetry (optional but recommended)
	•	API Docs & Versioning: ASP.NET API Versioning + Swashbuckle (Swagger)
	•	Rate limiting: ASP.NET Core RateLimiter middleware

⸻

3. Multi-Tenancy Model

3.1 PlatformDB (global)

Holds global data:
	•	PlatformUser
	•	Id (PlatformUserId)
	•	FirebaseUid
	•	Email, name, etc.
	•	Tenant
	•	Represents one community
	•	Name, status, region, created date
	•	TenantConnectionString
	•	TenantId
	•	Connection string for that tenant’s DB
	•	Plan
	•	Plan tiers (Basic, Standard, Premium, etc.)
	•	Includes settings such as:
	•	MaxRequestsPerMinute
	•	Feature flags
	•	TenantPlan
	•	TenantId → assigned PlanId
	•	Permission (global permission catalog)
	•	Key (e.g. MAINTENANCE_REQUEST_VIEW_ALL)
	•	Module (Maintenance, Visitors, Announcements, etc.)
	•	Description
	•	Platform RBAC:
	•	PlatformRole
	•	PlatformRolePermission (PlatformRole ↔ Permission)
	•	PlatformUserRole (PlatformUser ↔ PlatformRole)
	•	UserTenantMembership
	•	PlatformUserId
	•	TenantId
	•	Status: Invited, Active, Suspended, etc.
	•	Used for membership checks and GET /me/tenants

3.2 TenantDB (per tenant)

Each tenant has its own DB with identical schema:
	•	Identity/linking
	•	TenantUser
	•	TenantUserId
	•	PlatformUserId
	•	Tenant-specific profile (phone, unit reference, etc.)
	•	Community structure
	•	Block / Building
	•	Floor
	•	Unit
	•	People & occupancy
	•	Owner
	•	Resident
	•	Lease
	•	Unit, residents, start/end dates, rent amount, status
	•	Visitor management
	•	Visitor
	•	VisitorEntry (who, when, which unit, status)
	•	Amenities
	•	Amenity
	•	AmenityBooking (request, approval status, times)
	•	Maintenance
	•	MaintenanceRequest
	•	MaintenanceAssignment
	•	MaintenanceUpdate (status, comments, photos)
	•	Announcements
	•	Announcement
	•	Attachments
	•	FileAttachment
	•	Blob path/URL
	•	Owner type & ID
	•	Tenant RBAC
	•	RoleGroup
	•	e.g. CommunityAdmin, CommunityManager, Owner, Resident, MaintenanceManager, MaintenanceSupervisor, MaintenanceStaff, SecuritySupervisor, SecurityGuard
	•	IsSystemDefault
	•	RoleGroupPermission
	•	RoleGroupId
	•	PermissionKey (from global Permission catalog)
	•	TenantUserRoleGroup
	•	TenantUserId
	•	RoleGroupId
	•	Multiple roles allowed per user/tenant

⸻

4. Identity, Membership & Tenant Selection

4.1 Authentication (Firebase via IAuthService)
	•	Clients (web/mobile) authenticate with Firebase Auth.
	•	On successful login:
	•	Client receives Firebase ID token (JWT).
	•	Each API request includes:
	•	Authorization: Bearer <FirebaseIdToken>

Backend:
	•	Validates token via IAuthService.
	•	Resolves PlatformUser by FirebaseUid.

4.2 Membership across multiple communities
	•	UserTenantMembership in PlatformDB links a single PlatformUser to multiple tenants.
	•	Example: one user can be a resident in:
	•	Tenant A (their home)
	•	Tenant B (father’s apartment)
	•	GET /me/tenants returns all tenants where:
	•	UserTenantMembership.Status = Active (or similar)

4.3 Tenant selection (multi-tenant UX)
	•	After login:
	1.	Client calls GET /me/tenants.
	2.	API returns list: [ { tenantId, tenantName, rolesSummary }, ... ].
	•	UI behavior:
	•	Web:
	•	Platform admin: sees all tenants in a dropdown.
	•	Community admin: sees only their tenant(s).
	•	Mobile:
	•	If one tenant: auto-select.
	•	If multiple: show a “Choose community” screen.

For all tenant-scoped API calls:
	•	Client sends X-Tenant-Id: <tenantId> header.

4.4 TenantContext
	•	ITenantContext:

public interface ITenantContext
{
    string TenantId { get; }
    string? UserId { get; } // PlatformUserId
}


	•	TenantContext middleware:
	•	Validates auth.
	•	Verifies the user belongs to X-Tenant-Id via UserTenantMembership.
	•	Populates ITenantContext.
	•	Enriches logs with TenantId and UserId.

⸻

5. Roles, Groups & Permissions (RBAC)

5.1 Permission catalog (global)
	•	Defined once in PlatformDB (Permission table).
	•	Permissions reused by:
	•	Platform roles
	•	Tenant RoleGroups

5.2 Platform-level RBAC
	•	PlatformRole, PlatformRolePermission, PlatformUserRole.
	•	Used for:
	•	Tenant management
	•	Billing
	•	Support / superadmin features
	•	Plan/tier management

5.3 Tenant-level RBAC (per community)
	•	In each TenantDB:
	•	RoleGroup defines group labels (CommunityAdmin, Resident, etc.).
	•	RoleGroupPermission maps RoleGroup ↔ PermissionKey.
	•	TenantUserRoleGroup assigns groups to TenantUser.

A user may have:
	•	Different roles in different tenants.
	•	Multiple roles in the same tenant.

5.4 Authorization flow (with caching)

For each tenant-scoped request:
	1.	Resolve PlatformUser from token.
	2.	Get TenantId from ITenantContext.
	3.	Build a cache key:
permissions:{TenantId}:{PlatformUserId}.
	4.	Try ITenantCache:
	•	If found, use the cached permission set.
	5.	On cache miss:
	•	Load TenantUser, RoleGroups and RoleGroupPermissions from TenantDB.
	•	Compute effective permissions (set of PermissionKeys).
	•	Store in cache (TTL: 5–10 minutes, configurable).
	6.	Policy-based authorization checks required permission(s).

Invalidation:
	•	When roles change (e.g. TenantUserRoleGroup or RoleGroupPermission updated), services clear:
	•	permissions:{TenantId}:{PlatformUserId} (or all keys for TenantId if needed).

5.5 Platform admin precedence
	•	No implicit “super RoleGroup” will be created in TenantDB.
	•	Instead, precedence is handled in the authorization handler:

Flow:
	1.	Evaluate platform roles from PlatformDB:
	•	If user has a PlatformRole that grants super/support-level access (e.g. TENANT_SUPPORT_SUPER_ACCESS), the handler may:
	•	Bypass tenant RoleGroup checks for certain operations (typically read/support).
	•	Access is still audited for traceability.
	2.	If platform roles do not grant the required capability:
	•	Apply the regular tenant RBAC flow using the permission set from TenantDB.

This keeps tenant data “clean” and makes the override behavior explicit and centralized.

⸻

6. Tenant Domain Features

Per tenant (TenantDB):
	1.	Community structure
	•	Setup of Blocks → Floors → Units.
	2.	Occupancy
	•	Owners (who owns units).
	•	Residents (who lives where).
	•	Leases (unit, residents, duration, rent).
	3.	Invites
	•	Community admin invites residents/owners.
	•	Residents can invite more co-residents in the same unit.
	4.	Visitor management
	•	Residents:
	•	Pre-register visitors.
	•	Security app:
	•	Register walk-in visitors/deliveries.
	•	Choose tenant + unit.
	•	System:
	•	Sends push notification to residents of that unit.
	•	Residents approve/deny.
	•	Visitor entry status tracked.
	5.	Amenity booking
	•	Residents request amenity slots.
	•	Community admin/manager approves or rejects.
	•	Notifications sent via FCM.
	6.	Maintenance
	•	Residents create maintenance requests.
	•	Maintenance manager/supervisor:
	•	Views requested maintenance.
	•	Assigns to Maintenance staff.
	•	Maintenance staff:
	•	See assigned jobs.
	•	Update status.
	•	Capture photos and notes.
	7.	Announcements
	•	Community admin creates announcements.
	•	Broadcast to all users in that tenant.
	•	Push notifications + in-app list.
	8.	Owner view
	•	Owners see:
	•	Residents in their units.
	•	Leases.
	•	Rent info and history.
	•	Yearly maintenance charges / payments (when implemented).

⸻

7. Data Access, Migrations & Auditing

7.1 DbContexts
	•	PlatformDbContext
	•	Single connection string in config.
	•	Migrations: Savi.Infrastructure.Platform.
	•	TenantDbContext
	•	Connection string resolved per tenant.
	•	Migrations: Savi.Infrastructure.Tenant (shared schema for all TenantDBs).

7.2 TenantDbContext factory
	•	ITenantDbContextFactory:
	•	Input: TenantId.
	•	Looks up connection string in PlatformDB (or cached).
	•	Builds TenantDbContext with that string.
	•	Used by tenant-scoped services & jobs.

7.3 Migrations
	•	PlatformDB:
	•	Database.Migrate() on app startup.
	•	TenantDBs:
	•	TenantMigrationHostedService:
	•	On startup:
	•	Enumerates all tenants from PlatformDB.
	•	For each tenant:
	•	Creates TenantDbContext via factory.
	•	Runs Database.Migrate().
	•	On tenant creation:
	•	Provisions DB.
	•	Runs migrations for that tenant only.
	•	Seeds default RoleGroups and tenant config.

7.4 Auditing (scope & examples)
	•	Base interface IAuditableEntity:
	•	CreatedAt, CreatedBy, ModifiedAt, ModifiedBy.
	•	Audit.NET:
	•	Logs changes for audited entities to:
	•	PlatformAuditLog (PlatformDB)
	•	TenantAuditLog (TenantDB)

Audited entities – examples:
	•	PlatformDB:
	•	Tenant (create/update status, plan changes).
	•	TenantPlan, PlatformUserRole, UserTenantMembership.
	•	TenantDB:
	•	Lease (creation, modifications, termination).
	•	TenantUser (role assignments, status changes).
	•	MaintenanceRequest (status transitions, reassignment).
	•	Announcement (creation/edits).
	•	Any future payment/charge entities.

Excluded / non-audited high-volume entities – examples:
	•	Extremely chatty logs, such as:
	•	VisitorHeartbeat or frequent “presence ping” rows (if modeled).
	•	Low-value telemetry-like data.
	•	Core Visitor and VisitorEntry may still be audited, but not every tiny sub-event.

Optional aggregation:
	•	Forward audit events to centralized log analytics (e.g. Azure Log Analytics) for cross-tenant queries.

⸻

8. Cross-Cutting Infrastructure

8.1 Logging & tracing
	•	Logging:
	•	ILogger<T> + Serilog as sink provider.
	•	Enrich logs with:
	•	TenantId (from TenantContext)
	•	UserId
	•	CorrelationId
	•	Correlation ID middleware:
	•	Reads X-Correlation-Id header or generates new GUID.
	•	Optional OpenTelemetry:
	•	ASP.NET Core, HttpClient, EF Core instrumentation.
	•	Export to chosen backend later.

8.2 Health checks & readiness
	•	ASP.NET Core HealthChecks:
	•	/health/live – liveness (process is running).
	•	/health/ready – readiness:
	•	PlatformDB connectivity.
	•	Sample of TenantDBs connectivity.
	•	Azure Blob Storage connectivity.

8.3 Caching
	•	ITenantCache abstraction:
	•	Keys are automatically prefixed with TenantId.
	•	v1 implementation:
	•	IMemoryCache.
	•	Future:
	•	Redis-backed ITenantCache.
	•	Usage:
	•	Permission sets per (TenantId, PlatformUserId).
	•	Tenant configuration (plan, feature flags).
	•	Tenant structure (blocks/floors/units) if needed.

8.4 Background jobs (Hangfire, tenant-aware)
	•	IBackgroundJobScheduler:
	•	Enqueue, Schedule, Recurring APIs.
	•	Implementation:
	•	Hangfire with dedicated job DB (e.g. SaviHangfire), not PlatformDB.
	•	Jobs:
	•	Send push notifications.
	•	Send email invites.
	•	Perform scheduled cleanup / maintenance tasks.
	•	Tenant awareness:
	•	Jobs accept tenantId as a parameter.
	•	At job start:
	•	Check Tenant status in PlatformDB.
	•	If tenant deleted/disabled → no-op, log, exit.
	•	Use ITenantDbContextFactory to work within correct TenantDB.

8.5 File storage (Azure Blob + abstraction)
	•	IFileStorageService:
	•	UploadAsync, DownloadAsync, DeleteAsync.
	•	Implementation:
	•	Azure Blob Storage (Azure.Storage.Blobs).
	•	One container (e.g. savi-files) with virtual folders:
	•	tenant-{TenantId}/maintenance/{requestId}/{fileName}
	•	tenant-{TenantId}/leases/{leaseId}/{fileName}, etc.
	•	API/svc code only depends on IFileStorageService, not directly on Azure SDK.

8.6 Rate limiting (per tenant, per plan)
	•	ASP.NET Core RateLimiter middleware.
	•	Partitioning:
	•	By TenantId (from ITenantContext).
	•	Limit configuration:
	•	From Plan / TenantPlan in PlatformDB:
	•	Basic: e.g. 100 req/min
	•	Standard: e.g. 500 req/min
	•	Premium: e.g. 2000 req/min
	•	Rate limit values are cached and not reloaded on every request.

8.7 Error handling
	•	Global exception middleware:
	•	Logs exceptions with:
	•	TenantId, UserId, CorrelationId.
	•	Returns uniform error structure, e.g.:

{
  "traceId": "...",
  "code": "INTERNAL_ERROR",
  "message": "Something went wrong. Please try again."
}


	•	No connection strings or internal stack traces are exposed.

8.8 API versioning & documentation
	•	Versioning:
	•	Asp.Versioning library.
	•	Route-based: /api/v1/..., /api/v2/....
	•	Swagger:
	•	Swashbuckle, one document per API version.
	•	Swagger UI protected in non-dev environments.
	•	Tenant endpoint design:
	•	All list endpoints support:
	•	Pagination: page, pageSize (or offset, limit).
	•	Filtering: query params like status, unitId, dateFrom, dateTo.
	•	Sorting: sortBy, sortDirection.

⸻

9. Data Privacy & Compliance
	•	Use DB-level encryption at rest (e.g. TDE in Azure SQL/Postgres).
	•	Optionally encrypt sensitive fields at app level (e.g. national ID, maybe phone).
	•	Strict RBAC and auditing for sensitive operations.
	•	Data export/deletion capabilities:
	•	Per-tenant export & anonymization for offboarding.
	•	Support data deletion or anonymization per user/tenant (GDPR-style).

⸻

10. Vendor Lock-In Mitigation
	•	Auth:
	•	IAuthService abstracts Firebase.
	•	Backend only depends on “identity validated” + claims.
	•	Can swap to Auth0/custom IdP later.
	•	Push:
	•	IPushNotificationService abstracts FCM.
	•	Storage/Jobs/Cache:
	•	IFileStorageService, IBackgroundJobScheduler, ITenantCache abstractions already in design.

⸻

11. Testing Strategy (with cross-tenant leak checks)
	•	Unit tests:
	•	RBAC resolution and precedence (platform vs tenant).
	•	TenantContext middleware and membership checks.
	•	Integration tests:
	•	Use temporary DBs (Testcontainers).
	•	Setup PlatformDB and multiple TenantDBs.
	•	Test flows: onboarding, invites, visitors, maintenance, announcements.
	•	Cross-tenant leak tests (critical):
	•	Create TenantA and TenantB with distinct data.
	•	Ensure:
	•	A user in TenantA cannot access TenantB data by:
	•	Changing X-Tenant-Id.
	•	Guessing IDs.
	•	Misconfigured ITenantDbContextFactory (in tests) doesn’t break isolation:
	•	Membership checks / TenantContext still prevent data exposure.
	•	Test:
	•	Cache behavior (ITenantCache) respects tenant prefixes.
	•	Blob path generation always uses tenant-{TenantId} prefix.
	•	Performance tests:
	•	Permission caching impact under load.
	•	Rate limiting behavior per plan/tier.

⸻

This is v3 with everything you’ve raised folded in:
multi-tenant design, RBAC, performance optimizations, admin precedence, auditing, jobs, rate limiting, leak prevention, and vendor abstraction.

Review this as your “master doc”.
When you’re ready, we can pick a next step like:
	•	designing the entity classes & DbContext code, or
	•	defining the concrete API endpoints (e.g. /api/v1/tenants, /maintenance-requests, /visitors, etc.).


    Got it — here are only the delta changes you should apply on top of v3.

⸻

1️⃣ RBAC Permission Cache Key (Naming & ID)

Change in RBAC / Caching sections:
	•	Use this exact cache key format for permission sets:

{TenantId}:perm:{PlatformUserId}

	•	TenantId = from ITenantContext
	•	PlatformUserId = global user ID from PlatformDB (✅ not TenantUserId)

Anywhere the doc previously implied perm:{TenantId}:{PlatformUserId}, replace it with:

Cache key: {TenantId}:perm:{PlatformUserId}

⸻

2️⃣ Permission Cache Invalidation (Who Does It)

Clarify in RBAC section (invalidation):
	•	Invalidation is manual in service layer, not automatic.

Add:

After any change to TenantUserRoleGroup or RoleGroupPermission, the corresponding service must explicitly clear the permission cache for affected users:
	•	For user-specific changes:
	•	Remove: {TenantId}:perm:{PlatformUserId}
	•	For group-wide changes:
	•	Either remove all affected users’ keys, or clear all permission entries for that tenant (implementation choice, but service-owned).

⸻

3️⃣ Platform Admin Bypass Config (Data-Driven)

Add to Platform RBAC / Precedence section:

Introduce a new PlatformDB table:

PlatformRoleBypassPermission
----------------------------------
Id
PlatformRoleId   (FK -> PlatformRole)
PermissionKey    (string, matches Permission.Key)
Scope            (e.g. ReadOnly, ReadWrite, Full)

And update precedence logic:

The authorization handler first checks PlatformRoleBypassPermission for any (PlatformRoleId, PermissionKey) for the current user’s platform roles. If a match exists, access is granted according to Scope and the action is audited. If no match exists, normal tenant RBAC (RoleGroups in TenantDB) is evaluated.

⸻

4️⃣ Rate Limiting Tied to Plan/PlanFeature

Update Rate Limiting section:

Explicitly tie limits to Plan configuration:
	•	In PlatformDB, define limits via either:
	•	Plan.MaxRequestsPerMinute
or
	•	PlanFeature with Key = "MaxRequestsPerMinute" and numeric Value.

Then:

For each request, the rate limiter uses TenantId → TenantPlan → Plan/PlanFeature.MaxRequestsPerMinute (cached) to configure the per-tenant limit. Example: Basic=100, Standard=500, Premium=2000 requests/minute.

⸻

5️⃣ Testing Scope – Background Jobs

Extend Testing section with:

Add:

Background job tests:
	•	Verify that a job enqueued for TenantA only reads/writes TenantA’s DB (using ITenantDbContextFactory with that TenantId) and never touches TenantB, even if IDs overlap.
	•	Verify behavior when a tenant is disabled/deleted before the job runs: job should detect this via PlatformDB, log, and exit without throwing or touching any TenantDB.

These tests ensure tenant-aware jobs follow the same isolation guarantees as the API.

⸻

That’s all the deltas; everything else from v3 stays as-is.

Nice, that makes things very clear. Here’s how I’d fold your latest decisions into the feature plan.

⸻

🛒 Marketplace – Updated Rules

1. Approval workflow (mandatory)
	•	Every new marketplace listing is created in Pending status.
	•	It is not shown in the community feed until:
	•	A community admin/moderator approves it.
	•	After approval:
	•	Listing moves to Approved status.
	•	It appears in the community marketplace feed (and in nearby communities if the poster chose that option).
	•	Optional later: rejection reason if admin rejects.

2. Auto-expiry with renewals
	•	Each listing has:
	•	CreatedAt
	•	ExpiresAt = CreatedAt + X days (configurable or tenant-wide setting).
	•	If the listing reaches ExpiresAt:
	•	It becomes Expired and is hidden from the active feed.
	•	Resident can:
	•	Renew the listing → extend ExpiresAt by another X days and keep it in the feed.
	•	Admins can still see expired posts in a separate view (for audit/moderation/history).

⸻

💸 Payments – Manual for Now
	•	Amenity deposits (e.g. party hall) and marketplace transactions are:
	•	Handled offline/manual (cash, bank transfer, UPI, etc.) for now.
	•	System responsibilities (for this phase):
	•	Store deposit amount configuration for amenities.
	•	Optionally record simple flags/notes like:
	•	DepositRequired = true/false
	•	DepositPaid = true/false
	•	Free-text notes (“Paid in cash to office on 2025-01-10”).
	•	No payment gateway integration yet; we just design the data so it’s easy to plug in later.

⸻

🔔 Notifications – Confirmed Scope

We’ll treat these as core functional features, not just technical wiring:
	•	Maintenance
	•	New maintenance request created → notify maintenance team.
	•	Status changed (In Progress / Completed / Rejected) → notify requesting resident.
	•	Amenity bookings
	•	Booking request submitted → optional confirmation to resident.
	•	Booking approved/rejected → notify resident.
	•	Marketplace
	•	Listing approved → notify listing owner.
	•	New comment or offer on your listing → notify listing owner.
	•	Announcements
	•	New announcement published → notify all relevant residents/owners in that tenant.

Internally, all of that maps to Firebase FCM, but from the feature POV:
✅ Users get timely updates whenever something important happens.

⸻

