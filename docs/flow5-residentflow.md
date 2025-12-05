We’ll stay only on:
	•	Community admin → invites primary resident for a unit
	•	Primary resident signs up via mobile app + Firebase and
	•	Community admin/Primary resident → invites co-residents for the same unit


⸻


# Resident Onboarding & Co-Resident Invites (Community Admin → Mobile App via Firebase)

## 1. Scope

This flow covers:

1. **Community Admin**:
   - Sets a **primary resident** for a given unit.
   - Sends an invite to that primary resident.

2. **Primary Resident**:
   - Receives invite on mobile.
   - Signs up / logs in via **Firebase** (mobile app).
   - Accepts the invite and becomes the primary resident for that unit.

3. **Co-Residents**:
   - Primary resident invites **additional co-residents** for the same unit.
   - Co-residents sign up / log in via **Firebase** and accept their invites.
   - Community admin invites **additional co-residents** for the same unit,Co-residents sign up / log in via **Firebase** and accept their invites.(same as above point)

All of this is **tenant-scoped** and uses the same identity model:

- **Firebase** for identity (email + UID)
- **PlatformDB** for global user + tenant membership
- **TenantDB** for unit/lease/resident records and roles


---

## 2. Relevant Concepts / Entities (Conceptual)

### In PlatformDB

- `PlatformUser`
  - Global user record.
  - `Id`, `Email`, `FirebaseUid`, etc.

- `UserTenantMembership`
  - Links `PlatformUser` ↔ `TenantId`.
  - `Status` (Invited, Active, Suspended).

### In TenantDB (per community)

- `Unit`
  - The flat/apartment (already set up in structure step).

- `TenantUser`
  - Tenant-specific user record linked to a `PlatformUser`.
  - Has role/groups (e.g. Resident, Owner).

- `Lease`
  - Links `Unit` ↔ primary resident(s) (and possibly owners).
  - `UnitId`, `PrimaryResidentTenantUserId`, `LeaseStart`, `LeaseEnd`, `MonthlyRent`, etc.

- `ResidentInvite`
  - Represents an invite to join a unit as a resident.
  - Fields (conceptual):
    - `Id`
    - `TenantId`
    - `UnitId`
    - `Email`
    - `Name`
    - `IsPrimary` (true for primary resident, false for co-residents)
    - `Status` (Pending, Accepted, Expired, Revoked)
    - `InvitationToken` (random secure token)
    - `CreatedByTenantUserId` (who sent the invite)
    - `CreatedAt`, `ExpiresAt`

---

## 3. Flow A – Community Admin Invites Primary Resident

**Actor:** Community Admin  
**Goal:** Set the primary resident for a unit and send them an invite.

### 3.1 Preconditions

- Community structure is already configured:
  - Blocks, floors, units exist.
- Community Admin is logged in to the **web app** and is scoped to a particular tenant.

### 3.2 Steps (UI & Backend)

1. **Community Admin selects a Unit**

   - In the admin web app:
     - Navigate to **Units**.
     - Choose a specific unit, e.g. “Block A, Floor 3, Unit 301”.

2. **Choose “Set Primary Resident” / “Invite Primary Resident”**

   - On the unit detail page, Admin clicks:
     - `Invite Primary Resident`.

3. **Fill primary resident details**

   Form fields:

   - Full Name
   - Email
   - Phone (optional)
   - Lease details (optional now, but stored):
     - Lease start date
     - Lease end date (optional)
     - Monthly rent (optional)
     - Notes

4. **Backend actions on “Send Invite”**

   When admin submits the form, backend performs:

   1. **Ensure PlatformUser**

      - Check PlatformDB for existing `PlatformUser` by email.
      - If not found:
        - Create `PlatformUser` with:
          - `Email`
          - `Name` (if provided)
          - `FirebaseUid = null` (they haven’t logged in yet).

   2. **Ensure UserTenantMembership**

      - Create or update `UserTenantMembership` for:
        - `PlatformUserId`
        - `TenantId`
        - Set `Status = Invited` (for this tenant).

   3. **Create stub TenantUser & Lease in TenantDB**

      - TenantDB:
        - Create `TenantUser` row (if not already present) for that email/platform user.
          - Mark it as **inactive** or **not fully onboarded** until invite is accepted.
        - Create or update a `Lease` for this unit:
          - `UnitId`
          - `PrimaryResidentTenantUserId` (can be null now or set after acceptance)
          - Lease dates / rent if provided.

      (Alternatively, Lease can be created on acceptance, but pre-creating is fine.)

   4. **Create ResidentInvite (primary)**

      - TenantDB: `ResidentInvite` with:
        - `TenantId`
        - `UnitId`
        - `Email`
        - `Name`
        - `IsPrimary = true`
        - `Status = Pending`
        - `InvitationToken = <secure random token>`
        - `CreatedByTenantUserId` = Community Admin’s `TenantUserId`
        - `CreatedAt = now`
        - `ExpiresAt = now + N days` (e.g. 7 days)

   5. **Send invite link via email (or SMS in future)**

      - Email to primary resident with a deep link, for example:

        ```text
        https://app.savi.com/accept-resident-invite?tenantId=<tenantId>&unitId=<unitId>&token=<invitationToken>
        ```

        or a mobile deep link:
        ```text
        saviapp://accept-resident-invite?tenantId=<tenantId>&unitId=<unitId>&token=<invitationToken>
        ```

At this point, the primary resident has not yet logged in; only an invite exists.

---

## 4. Flow B – Primary Resident Accepts Invite via Mobile App & Firebase

**Actor:** Primary Resident  
**Goal:** Accept the invite, sign up/login in mobile app, and become the primary resident for that unit.

### 4.1 Open invite link on mobile

1. Primary resident opens the invite email on their phone.
2. They tap the invite link:
   - This opens the mobile app via deep link (or a web page that redirects into the app).
3. The mobile app reads the parameters:
   - `tenantId`
   - `unitId`
   - `token` (InvitationToken)

4. The app calls a backend endpoint to **validate the invite**, e.g.:

   ```http
   GET /api/resident-invitations/validate?tenantId=<tenantId>&unitId=<unitId>&token=<token>

	5.	Backend validates:
	•	Finds ResidentInvite by:
	•	TenantId, UnitId, InvitationToken
	•	Checks:
	•	Status = Pending
	•	ExpiresAt not passed
	•	IsPrimary = true
If valid:
	•	Returns basic invite info:
	•	Community name
	•	Unit label
	•	Invited email
If not valid:
	•	Returns error (invalid or expired invite).
	6.	App shows a screen:
“You’ve been invited as Primary Resident for [Unit] in [Community].
Continue by signing in with this email: [invite-email].”

The email is pre-filled and locked.

⸻

4.2 Primary Resident logs in / signs up via Firebase
	7.	On that screen, the user taps “Continue”.
	8.	The app triggers Firebase Auth (mobile SDK):
	•	If the user does not have an account with that email:
	•	They sign up (email/password, or later Google/Apple if allowed).
	•	If they already have an account:
	•	They sign in.
	9.	Firebase returns a Firebase ID token to the mobile app.

⸻

4.3 Accept invite (authenticated call)
	10.	Mobile app now calls an authenticated endpoint, e.g.:

POST /api/resident-invitations/accept
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "tenantId": "<tenantId>",
  "unitId": "<unitId>",
  "invitationToken": "<token>"
}

	11.	Backend actions:
	12.	Verify Firebase token
	•	Extract FirebaseUid, Email.
	13.	Lookup and validate ResidentInvite
	•	Find ResidentInvite by:
	•	TenantId, UnitId, InvitationToken.
	•	Check:
	•	Status = Pending
	•	IsPrimary = true
	•	ExpiresAt not passed.
	14.	Ensure email matches invite
	•	Compare Email from Firebase token with ResidentInvite.Email.
	•	If mismatch:
	•	Reject: “Please sign in with the invited email address.”
	15.	Resolve or create PlatformUser
	•	If PlatformUser for this FirebaseUid exists:
	•	Use it.
	•	Else if a PlatformUser exists for this Email with FirebaseUid = null:
	•	Attach this FirebaseUid to that PlatformUser.
	•	Else:
	•	Create new PlatformUser with:
	•	Email
	•	FirebaseUid
	•	Name from invite or user input.
	16.	Update UserTenantMembership
	•	Ensure UserTenantMembership exists for (PlatformUserId, TenantId).
	•	Set Status = Active.
	17.	Update TenantUser & Lease in TenantDB
	•	Find or create TenantUser for this PlatformUser in this tenant.
	•	Mark TenantUser as:
	•	Active
	•	RoleGroup includes Resident.
	•	If Lease was pre-created:
	•	Set PrimaryResidentTenantUserId to this TenantUserId.
	•	Mark lease as active.
	•	Else:
	•	Create a Lease now for UnitId with this tenant user as primary resident.
	18.	Mark invite as accepted
	•	ResidentInvite.Status = Accepted
	•	AcceptedAt = now
	19.	Backend returns something like:

{
  "userId": "platform-user-id",
  "email": "resident@example.com",
  "tenants": [
    {
      "tenantId": "T123",
      "tenantName": "Green Meadows",
      "units": [
        {
          "unitId": "U789",
          "label": "A-301",
          "isPrimaryResident": true
        }
      ],
      "roles": [ "Resident" ]
    }
  ]
}

	13.	Mobile app stores this and shows:

	•	Community home screen for that tenant.
	•	Unit details page (e.g. “Your Home: A-301”).
	•	A “My Household / Residents” section where they can invite co-residents.

⸻

5. Flow C – Primary Resident Invites Co-Residents (Same Unit)

Actor: Primary Resident
Goal: Invite additional residents to share the same unit in the app.

5.1 Initiate co-resident invite
	1.	In mobile app, primary resident goes to:
	•	“My Home” → “Residents” or “Household”.
	2.	They see themselves as Primary Resident and a list of current co-residents (possibly empty).
	3.	They tap “Invite Co-Resident”.
	4.	Form fields:
	•	Full Name
	•	Email
	•	Phone (optional)
	•	Relationship (optional: spouse, child, flatmate, etc.)

5.2 Backend processing of co-resident invite
	5.	App calls backend:

POST /api/units/{unitId}/residents/invite
Authorization: Bearer <firebase-id-token>
X-Tenant-Id: <tenantId>
Content-Type: application/json

{
  "name": "Co Resident Name",
  "email": "co@example.com",
  "phone": "+971...",
  "relationship": "Spouse"
}

	6.	Backend actions:
	1.	Verify Firebase token & TenantContext
	•	Ensure caller is authenticated and associated with (TenantId, UnitId).
	•	Ensure caller is allowed to invite co-residents (e.g. is primary resident or has permission).
	2.	Ensure PlatformUser
	•	Same pattern:
	•	Find/create PlatformUser by email.
	•	FirebaseUid remains null until they log in.
	3.	Ensure UserTenantMembership
	•	Upsert UserTenantMembership for:
	•	(PlatformUserId, TenantId)
	•	Set Status = Invited.
	4.	Create TenantUser stub & link to lease
	•	TenantDB:
	•	Create TenantUser stub for this email/PlatformUser.
	•	Mark as Resident (non-primary).
	•	Link to the same Lease as primary resident (same unit).
	•	e.g. create LeaseResident row or equivalent.
	5.	Create ResidentInvite (co-resident)
	•	TenantId
	•	UnitId
	•	Email
	•	Name
	•	IsPrimary = false
	•	Status = Pending
	•	InvitationToken = <secure random token>
	•	CreatedByTenantUserId = primary resident’s TenantUserId
	•	CreatedAt, ExpiresAt
	6.	Send invite email
	•	Email with deep link:

saviapp://accept-resident-invite?tenantId=<tenantId>&unitId=<unitId>&token=<invitationToken>



5.3 Co-resident accepts invite (same as primary, but IsPrimary = false)
	7.	Co-resident opens email on mobile and taps the link.
	8.	App performs:
	•	Validate invite (GET /resident-invitations/validate).
	•	Show “You’ve been invited as a resident for [Unit] in [Community].”
	9.	Co-resident signs up/logs in via Firebase with the same email.
	10.	App calls POST /resident-invitations/accept with:
	•	tenantId, unitId, invitationToken
	•	Firebase ID token in header.
	11.	Backend:

	•	Same validation as primary, but enforces IsPrimary = false.
	•	Ensures or creates PlatformUser, UserTenantMembership, TenantUser.
	•	Marks TenantUser as Resident (non-primary).
	•	Links TenantUser to existing Lease/Unit.
	•	Marks ResidentInvite as Accepted.

	12.	Response:

{
  "userId": "platform-user-id",
  "email": "co@example.com",
  "tenants": [
    {
      "tenantId": "T123",
      "tenantName": "Green Meadows",
      "units": [
        {
          "unitId": "U789",
          "label": "A-301",
          "isPrimaryResident": false
        }
      ],
      "roles": [ "Resident" ]
    }
  ]
}

	13.	In the household view:

	•	Primary resident’s app now shows:
	•	Co-resident added to the list.
	•	Co-resident’s app shows:
	•	Their unit and community like any other resident.

⸻

6. Behaviour Summary
	•	Community Admin:
	•	Initiates primary resident onboarding per unit.
	•	Primary Resident:
	•	Onboards via invite → Firebase signup → invite acceptance.
	•	Gains Resident role for that tenant and unit, with isPrimary = true.
	•	Can invite co-residents for the same unit.
	•	Co-Residents:
	•	Use the same pattern:
	•	Invite link → Firebase signup/login → invite acceptance.
	•	Gain Resident role for that tenant/unit, with isPrimary = false.

---

