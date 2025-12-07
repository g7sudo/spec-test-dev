1. Revised Visitor Data Model (Tenant DB)

1.1 Enums

/**************************************************
 * ENUMS – VISITOR MANAGEMENT
 **************************************************/

Enum VisitorType {
  Guest
  Delivery
  Service
  Other
}

Enum VisitorPassStatus {
  PreRegistered         // Created by resident in advance
  AtGatePendingApproval // Created or found at gate, waiting for resident approval
  Approved              // Approved by resident/admin, allowed to enter
  Rejected              // Explicitly rejected
  CheckedIn             // Visitor has entered
  CheckedOut            // Visitor has left
  Expired               // Auto-expired (no show / out of time window)
}

Enum VisitorSource {
  MobileApp   // Created by resident/owner via mobile
  SecurityApp // Created by guard at gate
  AdminPortal
  Other
}

1.2 VisitorPass (one row per visit)

This is your core “visit” record, now updated with:
	•	AccessCode (for pre-registered visits)
	•	DeliveryProvider (optional for deliveries)
	•	CheckInByUserId / CheckOutByUserId (which guard processed it)

/**************************************************
 * VISITOR PASS (ONE ROW PER VISIT)
 **************************************************/

Table VisitorPass {
  Id                uuid              [pk]
  Version           int               [not null, default: 1]
  IsActive          bool              [not null, default: true]

  CreatedAt         timestamptz       [not null, default: `now()`]
  CreatedByUserId   uuid              [not null, ref: > CommunityUser.Id]
  UpdatedAt         timestamptz       [default: null]
  UpdatedByUserId   uuid              [default: null, ref: > CommunityUser.Id]

  //-- Unit & source
  UnitId            uuid              [not null, ref: > Unit.Id, note: 'Unit this visitor is coming for']
  VisitType         VisitorType       [not null, default: 'Guest']
  Source            VisitorSource     [not null, default: 'MobileApp']

  //-- Pre-registration access code (for MobileApp-created visits)
  AccessCode        text              [default: null, note: 'Resident-shareable access code for pre-registered visits, e.g. 1234-5678']

  //-- Who the visit is for (usually primary resident in that unit)
  RequestedForUserId uuid             [default: null, ref: > CommunityUser.Id, note: 'Primary resident/user in the unit this visit is for (for reference & audit)']

  //-- Visitor details
  VisitorName       text              [not null]
  VisitorPhone      text              [default: null]
  VisitorIdType     text              [default: null, note: 'Optional ID type, e.g. CPR, Passport']
  VisitorIdNumber   text              [default: null]

  //-- Vehicle
  VehicleNumber     text              [default: null, note: 'License plate if captured']
  VehicleType       text              [default: null, note: 'Car, Bike, Van, etc. (free text)']

  //-- Delivery provider (optional, for VisitType = Delivery)
  DeliveryProvider  text              [default: null, note: 'Optional delivery provider, e.g. Uber Eats, Talabat, Amazon']

  //-- Misc
  Notes             text              [default: null, note: 'Additional info from resident or security']

  //-- Visit timing
  ExpectedFrom      timestamptz       [default: null, note: 'Start of expected arrival window']
  ExpectedTo        timestamptz       [default: null, note: 'End of expected arrival window']
  ExpiresAt         timestamptz       [default: null, note: 'When this pass auto-expires if not used']

  CheckInAt         timestamptz       [default: null]
  CheckOutAt        timestamptz       [default: null]

  CheckInByUserId   uuid              [default: null, ref: > CommunityUser.Id, note: 'Security user who processed check-in at gate']
  CheckOutByUserId  uuid              [default: null, ref: > CommunityUser.Id, note: 'Security user who processed check-out at gate']

  //-- Approval & status
  Status            VisitorPassStatus [not null, default: 'PreRegistered']

  ApprovedByUserId  uuid              [default: null, ref: > CommunityUser.Id, note: 'Resident/admin who approved entry']
  ApprovedAt        timestamptz       [default: null]

  RejectedByUserId  uuid              [default: null, ref: > CommunityUser.Id]
  RejectedAt        timestamptz       [default: null]
  RejectedReason    text              [default: null]

  //-- Notifications
  NotifyVisitorAtGate       bool      [not null, default: true, note: 'If true, notify resident when visitor arrives/uses code at gate']

  Note: 'Represents a single visit of a guest/delivery/service to a specific Unit, covering pre-registration (with access code), gate handling (walk-in), resident approval, and check-in/out with security audit.'
}

That’s all you need on the data side for the flows you described.

⸻

2. User Journeys & Flows (Visitors Module)

Think of a Visit as a lifecycle on VisitorPass:
	•	PreRegistered / AtGatePendingApproval → Approved / Rejected → CheckedIn → CheckedOut / Expired.

2.1 Personas
	•	Resident – lives in a unit, can:
	•	Pre-register visitors (with AccessCode).
	•	See visitors for their unit.
	•	Owner – if different from resident, similar app experience (can receive approvals).
	•	Security Guard – at gate:
	•	Searches by AccessCode / Unit / Name.
	•	Requests approvals.
	•	Checks visitors in/out.
	•	Community Admin / Supervisor – back office:
	•	Views visitor logs.
	•	Basic reporting & audit.

⸻

3. Flow A – Resident Pre-Registers Visitor (AccessCode)

3.1 Create pre-registered visit

Persona: Resident
Entry: App → Visitors → Pre-register Visitor

Steps:
	1.	Resident selects Unit context (implicitly their current unit).
	2.	Fills form:
	•	VisitorName
	•	VisitType (Guest / Delivery / Service / Other)
	•	Optional:
	•	VisitorPhone
	•	VehicleNumber, VehicleType
	•	DeliveryProvider (if VisitType = Delivery; dropdown + free text “Other”)
	•	Notes
	•	ExpectedFrom / ExpectedTo (date + time window; can default to “today” + 4 hours).
	3.	App submits → system creates VisitorPass:
	•	UnitId = their unit
	•	VisitType, Source = MobileApp
	•	VisitorName, VisitorPhone, etc.
	•	ExpectedFrom / ExpectedTo, ExpiresAt (derived)
	•	Status = PreRegistered
	•	RequestedForUserId = this resident’s CommunityUser
	•	Generate AccessCode, e.g. 1234-5678 and store in AccessCode.
	4.	App shows AccessCode + visit details to resident:
	•	“Share this Access Code with your visitor: 1234-5678”
	•	Share via WhatsApp/SMS/etc outside the app.

3.2 Resident view – upcoming & history

Entry: App → Visitors → My Visitors

Resident sees:
	•	Upcoming / Active
	•	PreRegistered visits for their unit (Status = PreRegistered / Approved, future window).
	•	Any CheckedIn visitors currently inside for their unit.
	•	History
	•	Past CheckedOut, Rejected, Expired visits.

Fields shown: VisitorName, VisitType, time window, AccessCode (for upcoming).

⸻

4. Flow B – Gate Handling for Pre-Registered Visitor (AccessCode)

4.1 Visitor arrives with AccessCode

Persona: Security Guard
Entry: Gate app → Visitors → Pre-Registered
	1.	Guard selects “Access Code” mode.
	2.	Enters the code (e.g. 1234-5678).
	3.	System searches VisitorPass:
	•	AccessCode = input
	•	Status IN (PreRegistered, Approved) (basically not used/expired).
	4.	System validates:
	•	Within time window:
	•	current time between ExpectedFrom and ExpectedTo (if set).
	•	Not expired: before ExpiresAt.
	•	Not already CheckedIn / CheckedOut / Expired.

If invalid → show reason (“Code not found”, “Code expired”, etc.)

4.2 Check-in using AccessCode

If valid:
	•	Gate UI shows:
	•	Unit
	•	VisitorName
	•	VisitType
	•	DeliveryProvider (if any)
	•	Notes (if any)
	•	Guard confirms Check-in:
	•	Status = CheckedIn
	•	CheckInAt = now
	•	CheckInByUserId = current guard

If NotifyVisitorAtGate = true:
	•	Push notification to all active residents of that unit:
	•	“Visitor John Doe checked in at 10:32 via access code.”

4.3 Check-out

Persona: Security Guard
Entry: Gate app → Visitors → Inside Now
	1.	Guard sees list of VisitorPass with Status = CheckedIn and CheckOutAt IS NULL.
	2.	Finds visitor by:
	•	Unit
	•	VisitorName
	•	AccessCode
	•	VisitType
	3.	Taps Check-out:
	•	Status = CheckedOut
	•	CheckOutAt = now
	•	CheckOutByUserId = current guard

Optional resident notification:
	•	“Visitor John Doe checked out at 11:15.”

⸻

5. Flow C – Walk-in Visitor (Live Approval)

5.1 Guard creates a walk-in visit

Persona: Security Guard
Entry: Gate app → Visitors → Walk-in
	1.	Guard selects Unit:
	•	Search by Unit Code or Resident Name.
	2.	Fills:
	•	VisitorName (or “Amazon Delivery” etc.)
	•	VisitType (Guest / Delivery / Service / Other)
	•	Optional:
	•	VisitorPhone
	•	VehicleNumber, VehicleType
	•	DeliveryProvider (if Delivery)
	•	Notes
	3.	Guard taps “Request Approval”.

System creates VisitorPass:
	•	UnitId from selection.
	•	VisitType = selected type.
	•	Source = SecurityApp.
	•	Status = AtGatePendingApproval.
	•	No AccessCode (this is not a pre-registered code path).

5.2 Resident approval via push notification

Persona: Resident(s) of that unit
	•	All active app users linked to that unit receive a push:
	•	“Visitor at gate for your unit”
	•	Name
	•	Type
	•	DeliveryProvider (if Delivery)
	•	In the app, they can:
	•	Allow
	•	Deny (with optional reason)

Approval logic:
	•	First response wins.
	•	If Allow:
	•	VisitorPass.Status = Approved
	•	ApprovedByUserId = that resident
	•	ApprovedAt = now
	•	Gate UI (pending list) updates: “Approved by ”.
	•	If Deny:
	•	Status = Rejected
	•	RejectedByUserId, RejectedAt
	•	RejectedReason (if provided)
	•	Gate sees it as rejected; guard does not check-in.

Timeout:
	•	If no response in X minutes:
	•	Option 1: auto-Expired.
	•	Option 2: stay AtGatePendingApproval and rely on manual decision at gate (configurable behaviour; data model supports both).

5.3 Guard check-in (after approval)

When Status = Approved:
	•	In gate “Pending / Approved” list, guard selects the visit.
	•	Confirms Check-in:
	•	Status = CheckedIn
	•	CheckInAt = now
	•	CheckInByUserId = guard

Check-out: same as pre-registered, via “Inside Now” list.

⸻

6. Role-specific Views / Dashboards

6.1 Security / Gate UI

Tabs / sections (all based on VisitorPass):
	1.	Pre-Registered (Access Code)
	•	Input AccessCode → validate → Check-in.
	2.	New Walk-in
	•	Create VisitorPass with Source = SecurityApp, Status = AtGatePendingApproval.
	3.	Pending Approvals
	•	List where Status = AtGatePendingApproval.
	•	Show how long they’ve been waiting.
	4.	Inside Now
	•	Status = CheckedIn, CheckOutAt IS NULL.
	•	Actions: Check-out.
	5.	Today’s Log
	•	CheckInAt or CreatedAt within today; for quick search & history.

6.2 Resident App (per unit)

Visitors section shows:
	•	Upcoming / Pre-registered
	•	Status = PreRegistered or Approved with future ExpectedFrom/ExpectedTo.
	•	Currently Inside
	•	Status = CheckedIn for this unit.
	•	History
	•	Past CheckedOut, Expired, Rejected visits.

They also see:
	•	Approval prompts (for walk-in visits).
	•	Confirmation notifications when visitors check-in/checkout.

6.3 Owner App

If you treat owner as just another CommunityUser linked to the unit, they get exactly the same:
	•	Approvals.
	•	Logs/history.

Later you can differentiate permissions if needed, but the data model doesn’t need changes.

6.4 Community Admin / Supervisor (web)

Admin portal → Visitors → Logs:
	•	Filterable table over VisitorPass:
	•	Date range
	•	Unit / Block
	•	VisitType (Guest/Delivery/Service)
	•	Source (MobileApp / SecurityApp / AdminPortal)
	•	Status (PreRegistered, Approved, CheckedIn, etc.)
	•	Columns:
	•	Date/time
	•	Unit
	•	VisitorName
	•	VisitType & DeliveryProvider
	•	Source
	•	CheckInBy / CheckOutBy (guard names)
	•	ApprovedBy / RejectedBy (resident)

Used for audit + insights (e.g., “How many deliveries?”, “At what times?”, “Which providers?”).

⸻

7. Simple State Diagram (VisitorPass)

Just to tie it all together:

stateDiagram-v2
    [*] --> PreRegistered: Resident pre-registers\n(Source = MobileApp)
    [*] --> AtGatePendingApproval: Walk-in created at gate\n(Source = SecurityApp)

    PreRegistered --> Approved: Guard validates AccessCode (optional)
    PreRegistered --> Expired: Time window/ExpiresAt passed

    AtGatePendingApproval --> Approved: Resident approves via app
    AtGatePendingApproval --> Rejected: Resident rejects
    AtGatePendingApproval --> Expired: No response / timeout

    Approved --> CheckedIn: Guard checks in at gate
    CheckedIn --> CheckedOut: Guard checks out
    Approved --> Expired: Never checked in within validity window

    Rejected --> [*]
    CheckedOut --> [*]
    Expired --> [*]

	•	PreRegistered + AccessCode path: no live approval needed when the code is valid.
	•	AtGatePendingApproval path: always needs resident approval.

⸻

This gives you:
	•	A clean, unit-centric data model with AccessCode + DeliveryProvider + guard audit.
	•	Clear flows for all actors (resident, owner, guard, admin).
	•	No extra tables, just a strong VisitorPass with enums.


    API Layer
VisitorPassesController.cs
API Endpoints
Method	Route	Description	Permission
GET	/api/v1/tenant/visitors/passes	List visitor passes	TENANT_VISITOR_VIEW
GET	/api/v1/tenant/visitors/passes/{id}	Get pass by ID	TENANT_VISITOR_VIEW
GET	/api/v1/tenant/visitors/passes/by-code/{accessCode}	Get pass by access code	TENANT_VISITOR_MANAGE
POST	/api/v1/tenant/visitors/passes	Create pre-registered pass	TENANT_VISITOR_CREATE
POST	/api/v1/tenant/visitors/passes/walk-in	Create walk-in pass	TENANT_VISITOR_MANAGE
POST	/api/v1/tenant/visitors/passes/{id}/approve	Approve pass	TENANT_VISITOR_CREATE
POST	/api/v1/tenant/visitors/passes/{id}/reject	Reject pass	TENANT_VISITOR_CREATE
POST	/api/v1/tenant/visitors/passes/{id}/check-in	Check in visitor	TENANT_VISITOR_MANAGE
POST	/api/v1/tenant/visitors/passes/{id}/check-out	Check out visitor	TENANT_VISITOR_MANAGE

User Flows Supported
Resident Pre-Registration Flow - Resident creates pass with auto-generated access code
Walk-in Visitor Flow - Security guard creates pass pending resident approval
Access Code Check-in Flow - Guard validates access code and checks in visitor
Approval Flow - Resident approves/rejects pending walk-in visitors
Check-out Flow - Guard checks out visitor when leaving