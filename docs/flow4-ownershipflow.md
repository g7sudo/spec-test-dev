ownership Module is exactly the right thing after units.

stick to your constraints:
	•	Owners are Parties (Individual / Company / Entity)
	•	They may or may not be community users
	•	Ownership is historical + can be joint (multiple parties per unit, with shares)
	•	No wizards, just lists + dialogs
	•	Unit remains the hub, but we also have a side-nav Ownership module

base this on the actual data model:

🔍 Relevant data model

From tenant-db.dbml:

Table UnitOwnership {
  Id                uuid [pk]
  Version           int
  IsActive          bool

  CreatedAt         timestamptz
  CreatedByUserId   uuid  // CommunityUser
  UpdatedAt         timestamptz
  UpdatedByUserId   uuid  // CommunityUser

  UnitId            uuid  // > Unit.Id
  PartyId           uuid  // > Party.Id

  OwnershipShare    numeric  // % or share: 100, 50, etc.
  FromDate          date
  ToDate            date  // null = still active
  IsPrimaryOwner    bool

  Note: 'Defines which Parties own a Unit, supports joint ownership and history.'
}

So a unit can have:
	•	Multiple UnitOwnership rows over time (history)
	•	Multiple concurrent owners (joint ownership)
	•	One IsPrimaryOwner per active set

⸻

define flows in two clusters:
	1.	Unit-centric ownership flows (inside Unit Detail – the hub)
	2.	Ownership module flows (side nav: Owners → Owner detail)

Using IDs like F-OWN-XX so you can drop them into your flow docs.

⸻

1️⃣ Unit-centric Ownership Flows (inside Unit Detail)

F-OWN-01 – View Ownership for a Unit

Actor: Tenant user with TENANT_OWNERSHIP_VIEW
Entry: /tenant/{slug}/units/{unitId} (Unit Detail)

Goal: See who owns this unit now, and who owned it historically.

Steps:
	1.	User opens Unit Detail (we already designed this).
	2.	Unit API also returns ownership data, or the UI calls:
	•	GET /tenant/units/{unitId}/ownerships (conceptual)
	3.	UI shows an Ownership section with two parts:
A. Current owners (active UnitOwnership where ToDate = null & IsActive = true):
	•	For each row:
	•	Owner name (Party.Name)
	•	Type (Individual / Company / Entity)
	•	OwnershipShare (%)
	•	FromDate
	•	Primary owner indicator (star/badge if IsPrimaryOwner = true)
	•	Actions (if TENANT_OWNERSHIP_MANAGE):
	•	“Transfer ownership”
	•	“Add joint owner”
	•	“End ownership” (per owner)
	•	“Open owner” (→ Owner Detail page)
B. Ownership history (timeline / table):
	•	All UnitOwnership rows ordered by FromDate descending:
	•	Owner name
	•	Share
	•	Period: FromDate → ToDate (or “Present”)
	•	Primary flag
	•	Read-only for most; maybe editable only if within allowed rules.
	4.	If there is no ownership yet:
	•	Show empty state:
	•	“This unit doesn’t have any recorded owners yet.”
	•	If manage permission: CTA: “Add first owner”

⸻

F-OWN-02 – Add First Owner to a Unit

Actor: Tenant user with TENANT_OWNERSHIP_MANAGE
Scenario: New community / new unit, no owners yet.

Entry: Unit Detail → Ownership section → “Add first owner”

Steps:
	1.	User clicks “Add first owner”.
	2.	A dialog opens with two main fields groups:
A. Select or create Party (Owner identity)
	•	Option 1: Search existing Party
	•	Autocomplete / search field:
	•	By name, email, phone, company name (using /tenant/parties endpoints).
	•	User picks existing Party.
	•	Option 2: Create new Party inline (owner doesn’t need to be community user):
	•	Toggle: “Create new owner”
	•	Fields from Party:
	•	PartyType: Individual / Company / Entity
	•	For Individual: FirstName, LastName, Phone, Email (optional)
	•	For Company: Name, RegistrationNumber, TaxNumber, Contact info
	•	On submit:
	•	POST /tenant/parties → returns PartyId.
B. Ownership details
Fields from UnitOwnership:
	•	OwnershipShare – default 100
	•	FromDate – default today
	•	IsPrimaryOwner – default true
	3.	On confirm:
	•	Backend creates UnitOwnership:
	•	POST /tenant/units/{unitId}/ownerships
	•	Enforces that if this is the first active row, share=100 makes sense, etc.
	4.	UI:
	•	Closes dialog
	•	Refreshes ownership section:
	•	Shows new owner under Current owners
	•	Adds to History list.

Errors:
	•	Validation (missing share, invalid date) → inline messages.
	•	Backend might enforce:
	•	OwnershipShare must be > 0 and <= 100.
	•	401 → session dialog.
	•	403 → “You do not have permission to manage ownership.”

⸻

F-OWN-03 – Add Joint Owner (Co-ownership, same period)

Actor: Tenant user with TENANT_OWNERSHIP_MANAGE
Entry: Unit Detail → Ownership → “Add joint owner”

Goal: Add another owner so multiple Parties share the same unit in parallel.

Steps:
	1.	User clicks “Add joint owner”.
	2.	Dialog similar to F-OWN-02 but with subtle differences:
A. Party selection
	•	Search or create Party (as above).
	•	Optionally show a list of existing owners and their shares for context.
B. Ownership details:
	•	OwnershipShare – user enters 50, 25, etc.
	•	FromDate – either:
	•	Same as main owner (default), or
	•	Custom date (e.g. later).
	•	IsPrimaryOwner:
	•	Checkbox to mark as primary owner or not.
	3.	On submit:
	•	POST /tenant/units/{unitId}/ownerships
	•	Backend rules:
	•	For overlapping active periods, the sum of active OwnershipShare must be <= 100.
	•	Only one IsPrimaryOwner = true among active rows (backend may demote old primary or reject).
	4.	On success:
	•	Ownership section updates:
	•	Multiple current owners with shares shown.
	•	Primary owner indicated.

Error cases:
	•	Share total > 100 → backend returns validation/error, UI shows “Total ownership share would exceed 100%.”
	•	Attempt to create second primary owner → backend either:
	•	Demotes old primary automatically, or
	•	Returns error: “There is already a primary owner for this period.”

⸻

F-OWN-04 – Transfer Ownership (Sale of Unit)

Actor: Tenant user with TENANT_OWNERSHIP_MANAGE
Scenario: All current owners sell the unit; new owner(s) take over.

Entry: Unit Detail → Ownership → “Transfer ownership”

Goal: Cleanly end all current active ownerships and create new ones, preserving history.

Steps:
	1.	User clicks “Transfer ownership”.
	2.	Dialog shows:
A. Snapshot of current owners:
	•	Owner names + shares + FromDate
B. New ownership group:
	•	One or more owner rows:
	•	Each row requires:
	•	Party (search/create as above)
	•	OwnershipShare
	•	IsPrimaryOwner
	•	One shared FromDate for new group defaults to today.
	3.	On submit:
	•	Backend transaction:
	1.	Set ToDate for all currently active UnitOwnership rows where ToDate IS NULL → equal to TransferFromDate - 1 day (or exactly FromDate rules you choose).
	2.	Create new UnitOwnership rows for new owners, with:
	•	FromDate = transfer date
	•	ToDate = null
	•	IsActive = true.
	4.	UI:
	•	Ownership History timeline updates:
	•	Old owners have an end date.
	•	New group appears under current owners and in timeline.

Why a dedicated Transfer flow?
	•	This is safer than manual “end old + add new” because:
	•	Dates are kept consistent.
	•	History is intact.
	•	You don’t end up with gaps or overlaps accidentally.

⸻

F-OWN-05 – End Ownership for One Owner (Without Transfer)

Actor: Tenant user with TENANT_OWNERSHIP_MANAGE
Scenario: One co-owner exits, but others remain.

Entry: Unit Detail → Ownership → owner row → “End ownership”

Steps:
	1.	User clicks “End ownership” on an owner row.
	2.	Dialog asks:
	•	End date (defaults to today).
	•	Optional note.
	3.	On confirm:
	•	Backend sets:
	•	ToDate = chosen date
	•	IsActive = false (if you use it)
	4.	UI:
	•	Row disappears from Current owners (if ToDate < today).
	•	Remains in History with period displayed.

Edge:
	•	If ending ownership would result in no owners at all:
	•	Backend can allow it (unit with no owner) or require setting a transfer/new owner first.

⸻

2️⃣ Ownership Module (Global view, side nav)

Now, a separate module makes sense, so admin can answer questions like “show me all owners and units they own”.

Side nav

In tenant scope, under Structure or separate group:
	•	Ownership
	•	Owners (main page)

⸻

F-OWN-06 – View Owners List (Global Ownership View)

Actor: Tenant user with TENANT_OWNERSHIP_VIEW
URL: /tenant/{slug}/ownership or /tenant/{slug}/owners

Data model: This is basically parties that appear in UnitOwnership (current or historical).

Steps:
	1.	User clicks Ownership in side nav.
	2.	App calls:
	•	GET /tenant/ownership/owners (conceptual), which returns aggregated view:
	•	PartyId
	•	Name
	•	PartyType
	•	ActiveOwnedUnitCount
	•	TotalHistoricalUnitsCount
	•	Maybe Phone/Email from Party.
	3.	List / table:
Columns:
	•	Owner name
	•	Type (Individual / Company)
	•	Active units they own
	•	Total units ever owned
	•	Last ownership activity date
	•	Actions:
	•	“Open owner” (Owner Detail)
	•	“Open party” (Party module) – optional
	4.	Filtering & search:
	•	Search by name / phone / email.
	•	Filter:
	•	“Current owners only”
	•	“Owners with more than 1 unit”
	•	Type filter.

⸻

F-OWN-07 – Owner Detail (Party-centric Ownership View)

Actor: Tenant user with TENANT_OWNERSHIP_VIEW
URL: /tenant/{slug}/ownership/owners/{partyId}

Goal: See everything this person/company owns or owned.

Steps:
	1.	User clicks on an owner from Owners List.
	2.	App loads:
	•	Party info via
	•	GET /tenant/parties/{partyId}
	•	Ownership history via
	•	GET /tenant/parties/{partyId}/ownerships (conceptual), list of UnitOwnership rows for that party.
	3.	Page layout:
A. Owner header (Party info):
	•	Name
	•	PartyType (Individual / Company / Entity)
	•	Contact details (phone, email, address)
	•	(Optional) Indicate if this party has a CommunityUser (linked to an actual app user).
B. Current units section:
	•	List of active UnitOwnership rows (ToDate = null):
	•	Unit Number
	•	Block
	•	Floor
	•	Share %
	•	FromDate
	•	Primary indicator
	•	Action: “Open unit” → /units/{unitId}
C. Ownership history section:
	•	Table of all UnitOwnership rows:
	•	Unit
	•	Share
	•	From → To
	•	Status (Current / Past)
	•	Action: “Open unit”
	4.	From Owner Detail, user can:
	•	Jump into any unit this party owns → Unit Detail → see ownership in context.

⸻

3️⃣ Permissions, Errors & Edge Cases

Permissions

Define something like:
	•	TENANT_OWNERSHIP_VIEW
	•	TENANT_OWNERSHIP_MANAGE

View only:
	•	Can see Ownership sections on Unit and Owner pages.
	•	Cannot see:
	•	Add owner / Transfer ownership / End ownership buttons.

Manage:
	•	Can perform all mutating actions:
	•	Add first owner
	•	Add joint owner
	•	Transfer ownership
	•	End ownership

Edge cases to consider (handled mostly by backend)
	•	Overlapping date ranges per Unit + Party
	•	Shares > 100% across active owners
	•	Multiple primary owners in same period
	•	Ownership with FromDate before unit creation (backend validation)
	•	Deleting Party that has UnitOwnership → should be blocked or require cleanup

Front-end flows assume backend enforces these and returns clear validation messages.

Error Handling
	•	401 → session expiry dialog (already in place).
	•	403 → show “You don’t have permission to manage ownership” and hide management CTAs.
	•	404:
	•	Invalid unitId or partyId → tenant-scoped “Not found” page.
	•	409:
	•	Conflicts like invalid transfer scenario → map to a user-friendly message:
	•	“The ownership data changed while you were editing. Please refresh and try again.”

⸻

4️⃣ How this fits your unit-centric world
	•	Unit Detail is now the hub for:
	•	Structure (Block/Floor)
	•	Parking
	•	Ownership (this module)
	•	Later: Residents / Leases, Maintenance, etc.
	•	Ownership module gives you:
	•	Owner-centric view (multi-unit owners, companies owning many units)
	•	Clear audit/history per Party + per Unit
