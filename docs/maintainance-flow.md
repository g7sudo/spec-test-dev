Table MaintenanceRequest {
  Id                  uuid                [pk]
  Version             int                 [not null, default: 1]
  IsActive            bool                [not null, default: true]

  CreatedAt           timestamptz         [not null, default: `now()`]
  CreatedByUserId     uuid                [not null, ref: > CommunityUser.Id]
  UpdatedAt           timestamptz         [default: null]
  UpdatedByUserId     uuid                [default: null, ref: > CommunityUser.Id]

  // --- Identity in UI
  TicketNumber        text                [not null, unique, note: 'Human-readable ticket number per community, e.g. MT-000123']

  // --- Unit + category (unit-only maintenance)
  UnitId              uuid                [not null, ref: > Unit.Id, note: 'Maintenance request is always for a Unit; community-wide reports use a separate module']
  CategoryId          uuid                [not null, ref: > MaintenanceCategory.Id]

  // --- Who the request is for (identity) vs who submitted it (actor)
  RequestedForPartyId uuid                [not null, ref: > Party.Id, note: 'Resident/owner party this request is for']
  RequestedByUserId   uuid                [not null, ref: > CommunityUser.Id, note: 'User who submitted the request (resident or admin)']
  AssignedToUserId    uuid                [default: null, ref: > CommunityUser.Id, note: 'Maintenance staff currently responsible']

  // --- Content
  Title               text                [not null]
  Description         text                [default: null]

  // --- Workflow
  Status              MaintenanceStatus     [not null, default: 'New']
  Priority            MaintenancePriority   [not null, default: 'Normal']
  Source              MaintenanceSource     [not null, default: 'MobileApp']

  RequestedAt         timestamptz         [not null, default: `now()`]
  DueBy               timestamptz         [default: null, note: 'Optional SLA target']

  AssignedAt          timestamptz         [default: null]
  StartedAt           timestamptz         [default: null]
  CompletedAt         timestamptz         [default: null]

  RejectedAt          timestamptz         [default: null]
  RejectionReason     text                [default: null]

  CancelledAt         timestamptz         [default: null]
  CancelledByUserId   uuid                [default: null, ref: > CommunityUser.Id]
  CancellationReason  text                [default: null]

  AssessmentSummary      text              [default: null, note: 'Short summary from site visit, e.g. Tap cartridge worn, needs replacement']
  AssessmentCompletedAt  timestamptz       [default: null, note: 'When the site visit assessment was completed']
  AssessmentByUserId     uuid              [default: null, ref: > CommunityUser.Id, note: 'Maintenance staff who did the site visit/assessment']

  // --- Resident review
  ResidentRating      int                 [default: null, note: '1–5 rating from resident']
  ResidentFeedback    text                [default: null]
  RatedAt             timestamptz         [default: null]

  Note: 'Unit-only maintenance ticket: unit + category + subject (Party) + actor (CommunityUser) + status, assignment, ticket number, and resident review.'
}


Enum MaintenanceDetailType {
  Service      // labour / inspection / work tasks
  SparePart    // parts, materials, consumables
  Other        // misc charges, fees
}

Table MaintenanceRequestDetail {
  Id                    uuid   [pk]
  Version               int    [not null, default: 1]
  IsActive              bool   [not null, default: true]

  CreatedAt             timestamptz [not null, default: `now()`]
  CreatedByUserId       uuid        [not null, ref: > CommunityUser.Id]
  UpdatedAt             timestamptz [default: null]
  UpdatedByUserId       uuid        [default: null, ref: > CommunityUser.Id]

  MaintenanceRequestId  uuid        [not null, ref: > MaintenanceRequest.Id]

  LineType              MaintenanceDetailType [not null, default: 'Service']
  Description           text        [not null, note: 'What is this line about? e.g. Replace tap cartridge']

  Quantity              numeric     [not null, default: 1]
  UnitOfMeasure         text        [default: null, note: 'e.g. pcs, hours']

  EstimatedUnitPrice    numeric     [default: null, note: 'Estimated price per unit']
  EstimatedTotalPrice   numeric     [default: null, note: 'Estimated total for this line; can be Quantity * EstimatedUnitPrice']

  IsBillable            bool        [not null, default: true, note: 'If false, internal work not charged to owner']

  SortOrder             int         [default: 0, note: 'For ordering lines in UI']

  Note: 'Detailed assessment lines for a maintenance request: service tasks and spare parts with estimated cost.'
}

Enum MaintenanceApprovalStatus {
  NotRequired     // (optional) explicit flag when approval is not needed
  Pending         // waiting for owner decision
  Approved        // owner has approved the requested amount
  Rejected        // owner has rejected this approval request
  Cancelled       // withdrawn by staff/admin
}


Table MaintenanceApproval {
  Id                    uuid                      [pk]
  Version               int                       [not null, default: 1]
  IsActive              bool                      [not null, default: true]

  CreatedAt             timestamptz               [not null, default: `now()`]
  CreatedByUserId       uuid                      [not null, ref: > CommunityUser.Id]
  UpdatedAt             timestamptz               [default: null]
  UpdatedByUserId       uuid                      [default: null, ref: > CommunityUser.Id]

  MaintenanceRequestId  uuid                      [not null, ref: > MaintenanceRequest.Id]

  Status                MaintenanceApprovalStatus [not null, default: 'Pending']

  RequestedAmount       numeric                   [default: null, note: 'Total estimated cost to be approved (sum of detail lines)']
  Currency              text                      [default: null]

  RequestedByUserId     uuid                      [not null, ref: > CommunityUser.Id]
  RequestedAt           timestamptz               [not null, default: `now()`]

  ApprovedByUserId      uuid                      [default: null, ref: > CommunityUser.Id]
  ApprovedAt            timestamptz               [default: null]

  RejectionReason       text                      [default: null]
  CancelledAt           timestamptz               [default: null]
  CancelledByUserId     uuid                      [default: null, ref: > CommunityUser.Id]
  CancellationReason    text                      [default: null]

  // --- NEW: owner payment tracking
  OwnerPaymentStatus    MaintenanceOwnerPaymentStatus [not null, default: 'NotRequired']
  OwnerPaidAmount       numeric                   [default: null, note: 'Actual amount paid by owner for this approved request']
  OwnerPaidAt           timestamptz               [default: null]
  OwnerPaymentReference text                      [default: null, note: 'Receipt no / transaction id / internal note']

  Note: 'Tracks extra-cost approval for a maintenance request and (optionally) whether owner payment was received.'
}

Enum MaintenanceOwnerPaymentStatus {
  NotRequired   // no charge to owner (internal/community-funded work)
  Pending       // owner needs to pay, not yet paid
  Paid          // fully paid
  Waived        // payment written off / waived by community
}


Phase 1 – Ticket creation (Resident or Admin)

Tables used: MaintenanceRequest
	•	Resident (or admin on behalf) creates a request for a Unit.
	•	We fill:
	•	UnitId, TicketNumber
	•	RequestedForPartyId (resident/owner Party)
	•	RequestedByUserId (who clicked)
	•	Status = New, Priority = Normal, RequestedAt = now

⸻

Phase 2 – Triage & assignment

Tables: MaintenanceRequest
	•	Supervisor reviews new request.
	•	Sets:
	•	Priority, maybe adjusts Category.
	•	AssignedToUserId, AssignedAt
	•	Status = Assigned (or InProgress if you prefer).

⸻

Phase 3 – Site visit & assessment (header + lines)

Tables: MaintenanceRequest, MaintenanceRequestDetail
	•	Technician goes to the Unit.
	•	After visit, they fill:
	•	On header:
	•	AssessmentSummary
	•	AssessmentByUserId
	•	AssessmentCompletedAt
	•	As detail lines:
	•	MaintenanceRequestDetail rows:
	•	LineType = Service / SparePart / Other
	•	Description, Quantity, EstimatedUnitPrice, EstimatedTotalPrice

Total estimated cost = sum of detail EstimatedTotalPrice.

⸻

Phase 4 – Decide if owner approval needed

Two paths:

4A. No owner approval required (small / internal jobs)
	•	No MaintenanceApproval row or one with:
	•	Status = NotRequired
	•	OwnerPaymentStatus = NotRequired
	•	Request can move directly to work:
	•	Status = InProgress → Completed.

4B. Owner approval required
Tables: MaintenanceApproval
	•	Supervisor creates one MaintenanceApproval:
	•	MaintenanceRequestId
	•	RequestedAmount = total estimate
	•	Status = Pending
	•	RequestedByUserId, RequestedAt
	•	OwnerPaymentStatus = Pending (since owner should pay later)
	•	Owner reviews in app:
	•	If approve:
	•	Status = Approved
	•	ApprovedByUserId, ApprovedAt
	•	If reject:
	•	Status = Rejected, RejectionReason
	•	MaintenanceRequest can be marked Cancelled or Rejected and stops there.

⸻

Phase 5 – Work execution & completion

Tables: MaintenanceRequest, optionally update MaintenanceRequestDetail.Actual*
	•	After approval (or no-approval path):
	•	Technician performs the work on the unit.
	•	During/after work:
	•	Status flows via MaintenanceRequest:
	•	Assigned → InProgress → Completed
	•	Optional:
	•	Update MaintenanceRequestDetail.ActualUnitPrice / ActualTotalPrice (if you want recorded actuals vs estimate).
	•	When done:
	•	CompletedAt = now on the MaintenanceRequest.

⸻

Phase 6 – Owner payment & close

Tables: MaintenanceApproval, MaintenanceRequest
	•	If this job is chargeable to owner (i.e., approval path used):
	1.	Back-office collects payment.
	2.	Update MaintenanceApproval:
	•	OwnerPaymentStatus = Paid
	•	OwnerPaidAmount (actual paid from owner)
	•	OwnerPaidAt
	•	OwnerPaymentReference (receipt/transaction)
	•	Independently, supervisor can treat Completed as “done & closed”, or you can have:
	•	Status = Completed → work finished
	•	(Optional) Status = Closed once payment is confirmed
— but you can also just keep it as Completed and use payment fields to know the financial status.
	•	Resident sees the request as Completed in history and can leave:
	•	ResidentRating, ResidentFeedback, RatedAt.


flowchart TD

  C[Create Request\nMaintenanceRequest: New] --> T[Triage & Assign\nStatus: Assigned]
  T --> SV[Site Visit & Assessment\nAssessment + Detail lines]

  SV --> D{Owner approval\nneeded?}

  D -->|No| W1[Work Execution\nStatus: InProgress -> Completed]
  W1 --> R1[Resident Rating\n(Rating, Feedback)]
  R1 --> DONE1[Lifecycle Complete]

  D -->|Yes| A1[Create MaintenanceApproval\nStatus: Pending]
  A1 --> A2{Owner Approves?}

  A2 -->|No| STOP[Approval Rejected\nRequest Cancelled/Rejected]
  A2 -->|Yes| W2[Work Execution\nStatus: InProgress -> Completed]

  W2 --> PAY[Owner Payment\nOwnerPaymentStatus: Pending -> Paid]
  PAY --> R2[Resident Rating\n(Rating, Feedback)]
  R2 --> DONE2[Lifecycle Complete]

Unit Maintenance Flow (flowX-maintenance-unit.md)

0. Scope

Module: Unit Maintenance
Context: One community (tenant).
Scope of this flow:
	•	Maintenance requests for units only (no common-area / community-wide issues here).
	•	Full lifecycle from resident request → assessment → owner approval (if needed) → fix → payment → close.
	•	Dashboards / worklists for:
	•	Maintenance Supervisor
	•	Maintenance Technician / Staff
	•	Owner approvals
	•	Resident request tracking

Out of scope (handled later / separate modules):
	•	Procurement / vendor management / purchase orders.
	•	Supplier invoices / community fund accounting.
	•	Common-area or amenity maintenance requests.

⸻

1. Personas & Entry Points

Personas
	1.	Resident
	•	Lives in a unit (Primary or Co-resident).
	•	Uses the mobile app.
	•	Can create maintenance requests for their unit and track status.
	2.	Owner
	•	Financially responsible for certain maintenance costs for the unit.
	•	Can be:
	•	Same as resident, or
	•	Different person (off-site landlord).
	•	Approves / rejects chargeable estimates.
	3.	Maintenance Supervisor / Admin
	•	Works in web admin (back office).
	•	Sees the full maintenance dashboard for the community.
	•	Triages, assigns tickets, oversees lifecycle and approvals.
	4.	Maintenance Technician / Staff
	•	Handles actual work at units.
	•	Sees “My Tickets” and updates status, assessment, and completion.

⸻

2. Supervisor Dashboard (Back Office Overview)

2.1 Dashboard Overview

Entry: Admin portal → Maintenance → Dashboard

Supervisor sees:
	•	Top KPIs:
	•	Open tickets count (by status: New, Assigned, InProgress, WaitingForApproval, Completed).
	•	Overdue / aging tickets (based on RequestedAt and DueBy).
	•	Tickets by category (Plumbing, Electrical, etc.).
	•	Charts / segments (not detailed here, but conceptually):
	•	Tickets by block/floor.
	•	Tickets by technician (workload).
	•	Tickets by priority.

2.2 Global Worklist (Inbox)

Below KPIs, a worklist table:

Columns:
	•	TicketNumber (clickable)
	•	Unit (Block / Floor / Unit)
	•	Resident (name)
	•	Category
	•	Status
	•	Priority
	•	RequestedAt
	•	AssignedTo (staff)
	•	SLA / DueBy (if used)

Filters:
	•	Status (multi-select)
	•	Category
	•	Priority
	•	Block / Floor / Unit
	•	AssignedTo (My Team / Unassigned / Specific technician)
	•	Date range (RequestedAt, CompletedAt)

Actions on each row:
	•	Open Request Detail (main action).
	•	Quick actions (optional, later): change priority, assign.

⸻

3. Resident Flow – Create & Track Unit Maintenance Requests

3.1 Create a new request (mobile app, unit-only)

Entry: Mobile app → My Home / My Unit → Maintenance
	1.	Resident taps “New Maintenance Request”.
	2.	App shows a form with:
	•	Category (dropdown from MaintenanceCategory: Plumbing, Electrical, etc.).
	•	Title (short text, required).
	•	Description (multi-line text).
	•	Photos (add 1–N images).
	3.	Unit context is implicit:
	•	App knows resident’s current active unit from lease.
	4.	On submit:
	•	System creates a MaintenanceRequest tied to that unit and resident.
	•	Ticket is assigned a TicketNumber (e.g., MT-000123).
	•	Status = New.

3.2 Resident view – My Unit → Maintenance

Entry: My Unit → Maintenance

Resident sees:
	•	Open Requests (Status not in [Completed/Closed/Cancelled]):
	•	List of cards:
	•	TicketNumber
	•	Short Title
	•	Category
	•	Status badge (New / Assigned / InProgress / Waiting / Completed)
	•	Last updated time
	•	History (Collapsed by default):
	•	Past requests (Completed/Closed/Cancelled) with quick glance info.

Tapping a request shows Request Detail:
	•	Header:
	•	TicketNumber, Status, Priority.
	•	Unit (this unit).
	•	Summary:
	•	Title, Category, Description, Photos (initial).
	•	Progress section:
	•	Current assignee (if any).
	•	Key dates (RequestedAt, maybe CompletedAt).
	•	Comments / Updates:
	•	Thread of staff/resident messages, with who said what and when.
	•	When Status = Completed:
	•	Resident can:
	•	Give Rating (1–5 stars).
	•	Optional Feedback (comment).
	•	After rating, rating is locked.

⸻

4. Supervisor Flow – Triage & Assign

4.1 Triage new tickets

Entry: Supervisor Dashboard → Worklist filter: Status = New
	1.	Supervisor opens a New ticket (click TicketNumber).
	2.	Request Detail shows:
	•	Unit (Block/Floor/Unit), link to Unit details.
	•	Resident Party & contact.
	•	Category, Title, Description, Photos.
	•	Source (MobileApp vs AdminPortal).
	3.	Supervisor triage actions:
	•	Set / adjust Category (if resident chose incorrectly).
	•	Set Priority (Low / Normal / High / Critical).
	•	Add an internal note (optional).

4.2 Assign to technician

Within Request Detail:
	1.	Supervisor chooses AssignedTo from a list of maintenance staff.
	2.	System:
	•	Sets AssignedToUserId.
	•	Sets AssignedAt = now.
	•	Updates Status:
	•	New → Assigned.
	3.	Technician now sees this in their “My Tickets” list.

⸻

5. Technician Flow – Site Visit & Assessment

5.1 Technician “My Tickets” view

Entry: Web UI or staff app → Maintenance → My Tickets

Technician sees:
	•	List of tickets where AssignedToUserId = current user.
	•	Filtering options:
	•	Status: Assigned, InProgress, Waiting, Completed (owned by them).
	•	Category.
	•	Unit.

Each row: TicketNumber, Unit, Category, Status, RequestedAt, Priority.

5.2 Performing the site visit
	1.	Technician picks a ticket → opens Request Detail.
	2.	Checks:
	•	Description.
	•	Photos.
	•	Resident contact info (if they need to call or schedule).
	3.	Once they visit the unit and inspect:
	•	They change Status:
	•	Assigned → InProgress.
	•	They fill assessment on the header:
	•	AssessmentSummary – e.g. “Tap cartridge worn; needs replacement. No pipe damage.”
	•	They mark Assessment complete:
	•	AssessmentCompletedAt = now
	•	AssessmentByUserId = technician

5.3 Adding detail lines (estimate)

Still on the same ticket, technician adds line items:
	•	For each service:
	•	LineType = Service
	•	Description (e.g., “Labour – tap replacement”)
	•	Quantity (e.g., 1 job)
	•	EstimatedUnitPrice, EstimatedTotalPrice.
	•	For each spare part:
	•	LineType = SparePart
	•	Description (e.g., “Cartridge 35mm”)
	•	Quantity (e.g., 1 pc)
	•	Estimated prices.

Supervisor and owner will see these lines later for approval if needed.

⸻

6. Supervisor Flow – Decide on Owner Approval

After assessment:

6.1 Supervisor review of estimate

Entry: Supervisor opens ticket (Status: InProgress, with assessment + lines).

Supervisor sees:
	•	Assessment summary.
	•	Detailed MaintenanceRequestDetail lines with estimated amounts.
	•	Total estimated cost (UI sums up all lines).

6.2 Path A – No approval required

Use this for small work or community-funded work.
	•	Supervisor marks the ticket as “No owner approval required”.
	•	Either:
	•	No MaintenanceApproval is created, or
	•	One with:
	•	Status = NotRequired
	•	OwnerPaymentStatus = NotRequired.
	•	Ticket remains assigned to tech, can proceed directly to work:
	•	Status flows: InProgress → Completed.

6.3 Path B – Owner approval required

For chargeable repairs.
	1.	Supervisor chooses “Send estimate for owner approval”.
	2.	System creates a MaintenanceApproval:
	•	Tied to this ticket.
	•	RequestedAmount = sum of detail lines.
	•	Status = Pending.
	•	OwnerPaymentStatus = Pending (owner is expected to pay if they approve).
	3.	The owner gets an approval notification.

⸻

7. Owner Flow – Approve / Reject Estimate

7.1 Owner approvals list

Entry: Owner app / portal → Maintenance Approvals

Owner sees a list of Pending approvals:
	•	TicketNumber
	•	Unit
	•	Short issue summary
	•	Total requested amount
	•	“Review” button.

7.2 View & decide

On opening an approval:
	•	Owner sees:
	•	TicketNumber, Unit.
	•	Original request summary (Title, Description, Photos).
	•	Assessment summary.
	•	Detailed line items (service + parts).
	•	Total estimated cost.
	•	Options:
	•	Approve
	•	Reject, with a required reason.

On Approve:
	•	MaintenanceApproval.Status = Approved.
	•	ApprovedByUserId, ApprovedAt set.
	•	Ticket remains active; technician/supervisor can proceed to work.

On Reject:
	•	MaintenanceApproval.Status = Rejected.
	•	RejectionReason recorded.
	•	Supervisor sees the rejection; ticket can be:
	•	Marked Cancelled, or
	•	Re-assessed/resubmitted (later enhancement).

⸻

8. Technician Flow – Execution & Completion

8.1 Execute work after approval (or no-approval path)

Once:
	•	No approval required OR
	•	Approval.Status = Approved,

technician proceeds to actually fix the issue in the unit.

Steps:
	1.	Technician performs the work.
	2.	Updates request:
	•	Adds completion notes (what was done).
	•	Optionally attaches after photos.
	3.	Sets Status:

	•	InProgress → Completed.
	•	CompletedAt = now.

Optionally (if you want deeper tracking):
	•	Update MaintenanceRequestDetail with actual unit/total prices.

⸻

9. Back-office Flow – Owner Payment & Closure

(Only relevant when owner is expected to pay.)

9.1 Recording owner payment

Entry: Supervisor / Accounts opens ticket with approved MaintenanceApproval.

If this job is chargeable:
	1.	After receiving payment (offline/online):
	•	Back-office opens the MaintenanceApproval detail.
	2.	They set:
	•	OwnerPaymentStatus = Paid.
	•	OwnerPaidAmount = actual amount collected.
	•	OwnerPaidAt = date/time.
	•	OwnerPaymentReference = receipt no / transaction id.

If waived or community-funded later:
	•	OwnerPaymentStatus = Waived.

9.2 Ticket final state

On maintenance side, the lifecycle is effectively:
	•	Work done → Status = Completed.
	•	Payment handled via OwnerPaymentStatus.

You can either:
	•	Treat Completed as final, or
	•	Add a Closed status for explicit archive state (Completed → Closed) if needed later.

⸻

10. Resident & Owner – Feedback & History

10.1 Resident feedback

When Status = Completed (or Closed):
	•	Resident’s app request detail shows:
	•	“Rate this service (1–5)”
	•	“Optional feedback comment”
	•	Once submitted:
	•	ResidentRating, ResidentFeedback, RatedAt saved.
	•	Rating is locked (one-time).

10.2 Resident history

Resident can always go to:
	•	My Unit → Maintenance → History to see:
	•	All past tickets:
	•	TicketNumber, Category, Status, Brief resolution summary.

10.3 Owner view of past approvals

Owner can view:
	•	List of all Approved / Rejected maintenance approvals for their units:
	•	TicketNumber
	•	Unit
	•	Date
	•	Amount
	•	Status (Approved / Rejected)
	•	Payment status (Paid / Pending / Waived)

This acts as their audit/history of chargeable maintenance for that property.

⸻

11. Unit-Centric View & Move-Out Check

11.1 Unit details – Maintenance tab (Admin)

Entry: Admin portal → Units → Unit 101 → Maintenance

Shows:
	•	Open tickets:
	•	Cards/list with TicketNumber, Title, Status, AssignedTo, RequestedAt.
	•	History:
	•	All past tickets for that unit (Completed/Closed/Cancelled).
	•	Actions:
	•	Open ticket details.
	•	Create a new ticket on behalf of resident (same flow as resident, but RequestedByUserId = admin).

11.2 Move-out hook

When admin initiates move-out for a unit:
	1.	System checks for any open maintenance requests for that Unit:
	•	Status in [New, Assigned, InProgress, Waiting…].
	2.	If exists:
	•	Show warning:
	•	“Unit 101 has 2 open maintenance requests. Please review before final move-out.”
	•	Provide quick links to those tickets.
	3.	Admin decides:
	•	Ensure they’re Completed.
	•	Use their state as input for deposit refund decisions (future deposit module).

⸻

12. Status Model (High Level)

You don’t need a new status enum immediately, but the conceptual flow is:

stateDiagram-v2
    [*] --> New

    New --> Assigned: Supervisor assigns staff
    Assigned --> InProgress: Technician starts work / site visit
    InProgress --> InProgress: Assessment & detail lines added

    InProgress --> WaitingForApproval: (implicit via Approval.Pending)
    WaitingForApproval --> InProgress: Approval Approved
    WaitingForApproval --> Cancelled: Approval Rejected

    InProgress --> Completed: Work done

    Completed --> [*]: Considered fully done, payment tracked via OwnerPaymentStatus
    Cancelled --> [*]

In implementation, WaitingForApproval can be either a distinct status or implicit when Approval.Status = Pending. The flow doc doesn’t force one; it just defines behaviour.

⸻

This document is deliberately unit-only, maintenance-only, and stops at owner payment, leaving purchase orders, vendors, and invoices to a future procurement module that you can connect later.