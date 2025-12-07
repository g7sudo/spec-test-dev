Architecture: Queue-Based Separation
┌─────────────────────────────────────────────────────────────────┐
│                     TENANT LEVEL                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tenant App checks preferences (CommunityUserProfile)            │
│       │                                                          │
│       ▼                                                          │
│  If user subscribed → Call Platform API to queue notification    │
│                                                                  │
│  ❌ NO direct access to Platform DB                              │
│  ❌ NO Firebase calls from tenant                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API Call
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PLATFORM LEVEL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Platform API: POST /api/v1/notifications/queue                  │
│       │                                                          │
│       ▼                                                          │
│  NotificationQueue (table)                                       │
│  ├── PlatformUserId                                             │
│  ├── Title, Body, Data                                          │
│  ├── Source (TenantId or "Platform")                            │
│  ├── Status (Pending, Sent, Failed)                             │
│  ├── DeduplicationKey                                           │
│  └── CreatedAt, ProcessedAt                                     │
│       │                                                          │
│       ▼                                                          │
│  Background Worker processes queue:                              │
│  - Deduplication (same message within X minutes)                │
│  - Rate limiting                                                │
│  - Get DeviceRegistrations for user                             │
│  - Push via Firebase Admin SDK                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
Platform DB Entities
PLATFORM DATABASE
├── PlatformUser (existing)
├── DeviceRegistration (NEW)
│   ├── PlatformUserId
│   ├── DeviceToken (FCM)
│   ├── DeviceId
│   ├── Platform (iOS/Android)
│   ├── AppVersion
│   └── IsActive, LastActiveAt
│
└── NotificationQueue (NEW)
    ├── Id
    ├── PlatformUserId (recipient)
    ├── Title
    ├── Body
    ├── Data (JSON payload)
    ├── SourceType (Platform / Tenant)
    ├── SourceTenantId (nullable)
    ├── DeduplicationKey (hash of title+body+userId+timeWindow)
    ├── Priority (High, Normal, Low)
    ├── Status (Pending, Processing, Sent, Failed, Deduplicated)
    ├── RetryCount
    ├── ErrorMessage
    ├── CreatedAt
    ├── ProcessedAt
    └── ExpiresAt (optional TTL)
API Endpoints
Platform Level (Device & Queue)
# Device Management (called by mobile app)
POST   /api/v1/platform/devices/register
DELETE /api/v1/platform/devices/{deviceId}
PUT    /api/v1/platform/devices/{deviceId}/token
GET    /api/v1/platform/devices

# Notification Queue (called by Tenant APIs or Platform Admin)
POST   /api/v1/platform/notifications/queue
POST   /api/v1/platform/notifications/queue/batch   # Multiple users

# Platform Admin only
POST   /api/v1/platform/notifications/broadcast     # All users
GET    /api/v1/platform/notifications/queue/status  # Queue monitoring
Tenant Level (Preferences only)
# Already exists
PUT    /api/v1/me/notification-settings
GET    /api/v1/me/notification-settings
Queue Notification Request
// POST /api/v1/platform/notifications/queue
{
  "platformUserId": "guid",
  "title": "Maintenance Update",
  "body": "Your request #123 has been approved",
  "data": {
    "type": "maintenance_update",
    "requestId": "guid",
    "tenantId": "guid"
  },
  "deduplicationKey": "maintenance_123_approved",  // Optional
  "priority": "normal",
  "expiresAt": "2025-12-08T00:00:00Z"  // Optional TTL
}
Flow Example
1. Tenant A: Maintenance request approved
   │
   ▼
2. Tenant handler checks CommunityUserProfile:
   - PushEnabled = true? 
   - NotifyMaintenanceUpdates = true?
   │
   ▼ (if yes)
3. Tenant calls Platform API:
   POST /api/v1/platform/notifications/queue
   {
     "platformUserId": "user-guid",
     "title": "Maintenance Update",
     "body": "Request approved",
     ...
   }
   │
   ▼
4. Platform API:
   - Validates request
   - Checks deduplication (same key within 5 mins?)
   - Inserts into NotificationQueue with Status=Pending
   │
   ▼
5. Background Worker (runs every few seconds):
   - Picks up Pending notifications
   - Gets DeviceRegistrations for user
   - Sends via Firebase Admin SDK
   - Updates Status=Sent or Status=Failed
Deduplication Logic
// If same deduplication key exists within time window, skip
var existing = await _db.NotificationQueue
    .Where(n => n.DeduplicationKey == request.DeduplicationKey)
    .Where(n => n.CreatedAt > DateTime.UtcNow.AddMinutes(-5))
    .Where(n => n.Status != NotificationStatus.Deduplicated)
    .AnyAsync();

if (existing)
{
    // Mark as deduplicated, don't send
    return Result.Success("Deduplicated");
}
Summary
Responsibility	Tenant Level	Platform Level
Check user preferences	✅	❌
Queue notification	Calls Platform API	✅ Receives & stores
Device registration	❌	✅
Deduplication	❌	✅
Firebase push	❌	✅
Rate limiting	❌	✅
Does this match what you're thinking?
Tenant → Only checks preferences, then calls Platform API to queue
Platform → Owns devices, queue, deduplication, and Firebase delivery