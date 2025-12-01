# SAVI – Authentication & Admin Onboarding Flows

Version: 0.1  
Scope: Auth flows only (no domain features).

---

## Table of Contents

- [SAVI – Authentication \& Admin Onboarding Flows](#savi--authentication--admin-onboarding-flows)
  - [Table of Contents](#table-of-contents)
  - [Core Concepts](#core-concepts)
  - [Platform Admin Login \& Bootstrap Flow](#platform-admin-login--bootstrap-flow)
    - [Purpose](#purpose)
    - [One-Time Setup](#one-time-setup)
      - [1. Create Firebase Project](#1-create-firebase-project)
      - [2. Configure Backend to Trust Firebase](#2-configure-backend-to-trust-firebase)
    - [How we continue from here](#how-we-continue-from-here)

---

## Core Concepts

For every user in SAVI (Platform Admin, Community Admin, Residents, etc.) there are **two layers**:

1. **Identity (Authentication)** – handled by **Firebase Authentication**  
   - Proves *who* the user is (email, Firebase UID, etc.).

2. **Roles & Permissions (Authorization)** – handled by **SAVI PlatformDB + TenantDB**  
   - Decides *what* the user can do (PlatformAdmin, CommunityAdmin, Resident, etc.).
   - PlatformDB: global roles (PlatformAdmin, etc.).
   - TenantDB: per-tenant roles/groups (CommunityAdmin, Resident, etc.).

Firebase is the **single identity provider** for the whole system.  
SAVI backend is the **source of truth for roles and tenant membership**.

---

## Platform Admin Login & Bootstrap Flow

### Purpose

Define **how the Platform Admin logs in for the first time** using **Firebase Auth**, and how the backend bootstraps the first **Platform Admin** user.

Covers:

- Initial system setup (first-ever Platform Admin login).
- All future logins for Platform Admin.

---

### One-Time Setup

#### 1. Create Firebase Project

- Create a Firebase project (e.g. `savi-dev`, `savi-prod`).
- Enable **Email/Password** sign-in.
- Create a **Web App** in Firebase and capture:
  - `apiKey`
  - `authDomain`
  - `projectId`
  - etc.

The frontend will use these values to talk to Firebase.

#### 2. Configure Backend to Trust Firebase

In backend configuration (e.g. `appsettings.json`):

```json
"Firebase": {
  "ProjectId": "savi-dev-or-prod",
  "ServiceAccountJsonPath": "/secrets/firebase-adminsdk.json"
}

Backend uses this to:
	•	Validate Firebase ID tokens from incoming HTTP requests.
	•	Extract FirebaseUid, Email, etc.

3. Configure Root Admin Emails (Bootstrap List)
To bootstrap the first Platform Admin, configure a list of allowed “root” emails:

"RootAdmins": {
  "Emails": [
    "you@yourcompany.com"
  ]
}

Rules:
	•	Any user who logs in with one of these emails can be auto-promoted to PlatformAdmin on their first successful login.
	•	This is config-driven, not hard-coded.
	•	After bootstrap, Platform Admin role is stored and managed in PlatformDB, not via this list.

⸻

First-Time Login

1. Frontend: Login via Firebase
	1.	Platform Admin navigates to the admin web app (e.g. https://admin.savi.app).
	2.	Login page uses the Firebase JS SDK.
	3.	User signs up/logs in using:
	•	Email: one of the configured root admin emails (e.g. you@yourcompany.com).
	•	Password (or other enabled Firebase provider).
	4.	Firebase returns a Firebase ID token (JWT) to the frontend.

2. Frontend → Backend: /api/auth/me
Frontend calls an auth endpoint, e.g.:

GET /api/auth/me
Authorization: Bearer <firebase-id-token>

No tenant header is needed here (platform context only).

3. Backend: Verify Token and Bootstrap PlatformUser
On /api/auth/me:
	1.	Verify Firebase token
	•	Validate signature, issuer, audience, expiry.
	•	Extract:
	•	FirebaseUid
	•	Email
	2.	Check for existing PlatformUser
	•	Query PlatformDB for a PlatformUser with this FirebaseUid.
Case A – PlatformUser exists
	•	Load PlatformUser and associated roles (e.g. from PlatformUserRole).
	•	Return user info + roles (normal login flow).
Case B – PlatformUser does not exist (first login for this Firebase user)
	•	Check if Email is in RootAdmins.Emails.
	•	If Email is in RootAdmins:
	•	Create new PlatformUser with:
	•	Email
	•	FirebaseUid
	•	Optional name/profile fields.
	•	Assign the PlatformAdmin role to this PlatformUser.
	•	If Email is not in RootAdmins:
	•	Option for now: reject with “not authorized for platform access”.
	3.	Return auth response

Example response:

{
  "userId": "platform-user-id",
  "email": "you@yourcompany.com",
  "roles": ["PlatformAdmin"],
  "tenants": []
}

	•	roles includes "PlatformAdmin" after bootstrap.
	•	tenants is empty initially because no communities exist yet.

4. Frontend: Show Platform Admin UI
	•	Frontend checks the roles array.
	•	If PlatformAdmin is present, it unlocks the platform admin functionality:
	•	e.g. “Onboard New Community”, “View All Communities”, etc.
	•	From here on, this user is a normal PlatformUser with PlatformAdmin role, not a special case.

⸻

Subsequent Logins

After the first successful login:
	1.	User logs into Firebase again (same email).
	2.	Frontend receives a Firebase ID token.
	3.	Frontend calls /api/auth/me again.
	4.	Backend:
	•	Validates token.
	•	Finds existing PlatformUser by FirebaseUid.
	•	Loads roles from PlatformDB (no bootstrap logic).
	5.	Response includes roles = ["PlatformAdmin", ...] as stored in DB.

No RootAdmins bootstrap behaviour is needed anymore for this user.

⸻

Community Admin Invite & Onboarding Flow

This flow describes how a Platform Admin invites someone to become a Community Admin (Tenant Admin) for a specific community, and how that person onboards using Firebase.

Data Model (Conceptual)

In PlatformDB:
	•	PlatformUser
	•	Global user record.
	•	Fields include:
	•	Id
	•	Email
	•	FirebaseUid (nullable until they log in)
	•	Name, etc.
	•	UserTenantMembership
	•	Links a PlatformUser to a TenantId.
	•	Contains membership info:
	•	PlatformUserId
	•	TenantId
	•	Status (Invited, Active, Suspended, etc.).
	•	TenantAdminInvite (conceptual name)
	•	Represents an invitation to be a community admin for a tenant.
	•	Fields (example):
	•	Id (GUID)
	•	TenantId
	•	Email
	•	Name
	•	Role (e.g. CommunityAdmin)
	•	Status (Pending, Accepted, Expired)
	•	InvitationToken (GUID or random string)
	•	CreatedAt, ExpiresAt

In TenantDB (per tenant):
	•	TenantUser
	•	RoleGroups/permissions (e.g. CommunityAdmin group)

The exact TenantDB details are handled later; for this flow, it’s enough that we ensure the invited user ends up with Community Admin rights in that tenant.

⸻

Flow A – Platform Admin Sends Community Admin Invite

Actor: Platform Admin
Goal: Invite a person to be Community Admin for a specific community (Tenant).
	1.	Platform Admin logs into the admin web app (via Platform Admin flow above).
	2.	From the Communities page, they open the target community (Tenant X).
	3.	They click “Invite Community Admin”.
	4.	A form is shown with fields:
	•	Name
	•	Email
	5.	On Send Invite, backend performs:
	1.	Create or find PlatformUser by email
	•	If a PlatformUser with this email already exists:
	•	Use that record.
	•	Else:
	•	Create a new PlatformUser with:
	•	Email
	•	Name (if provided)
	•	FirebaseUid = null (filled on first login).
	2.	Ensure UserTenantMembership
	•	Create or update UserTenantMembership for:
	•	PlatformUserId
	•	TenantId
	•	Status = Invited (initially).
	3.	Create TenantAdminInvite
	•	TenantId = X
	•	Email = <entered email>
	•	Name = <entered name>
	•	Role = CommunityAdmin
	•	Status = Pending
	•	InvitationToken = <random GUID or secure token>
	•	CreatedAt = Now
	•	ExpiresAt = Now + N days (e.g. 7 days)
	4.	Send invite email
	•	Email to invitee with a link like:

https://admin.savi.app/accept-invite?tenantId=<tenantId>&token=<invitationToken>


This completes the invite step; the invited user has not yet logged in or been linked to a Firebase account.

⸻

Flow B – Community Admin Accepts Invite & Logs In

Actor: Invited Community Admin
Goal: Accept invite, log in via Firebase, gain Community Admin rights in the tenant.

1. User clicks invite link
	1.	User opens the email and clicks the invite link:

https://admin.savi.app/accept-invite?tenantId=...&token=...


	2.	Frontend reads tenantId and token from the URL.
	3.	Frontend calls an API endpoint to validate the invite, for example:

GET /api/invitations/tenant-admin/validate?tenantId=<tenantId>&token=<token>


	4.	Backend checks:
	•	Is there a TenantAdminInvite with:
	•	This TenantId
	•	This InvitationToken
	•	Status = Pending
	•	Has ExpiresAt not passed?
	•	If valid:
	•	Return 200 OK with basic invite details (community name, invited email).
	•	If invalid:
	•	Return error (invalid/expired invite) and frontend shows an error page.
	5.	If valid, frontend shows a screen like:
“You’ve been invited as a Community Admin for [Community Name].
Please continue by signing in with this email: [invite-email].”

The email is pre-filled and locked to avoid mismatch.

2. User signs up / logs in with Firebase
	6.	User clicks “Continue” → login/sign-up flow using Firebase:
	•	Frontend triggers Firebase Auth UI.
	•	User signs up or logs in using the same email as the invite.
	•	When successful, Firebase returns a Firebase ID token to the frontend.

3. Frontend calls backend to accept invite (authenticated)
	7.	Frontend calls:

POST /api/invitations/tenant-admin/accept
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "tenantId": "<tenantId-from-link>",
  "invitationToken": "<token-from-link>"
}


	8.	Backend performs:
	1.	Verify Firebase token
	•	Extract FirebaseUid, Email.
	2.	Find and validate TenantAdminInvite
	•	Lookup invite by TenantId and InvitationToken.
	•	Validate:
	•	Status = Pending
	•	ExpiresAt not passed.
	3.	Ensure email matches
	•	Compare Email from Firebase token with TenantAdminInvite.Email.
	•	If they do not match:
	•	Reject with a clear error:
	•	“Please sign in with the invited email address.”
	4.	Resolve or create PlatformUser
	•	If a PlatformUser exists with this FirebaseUid:
	•	Use that.
	•	Else if a PlatformUser exists with this Email but FirebaseUid is null:
	•	Attach FirebaseUid to that existing PlatformUser.
	•	Else:
	•	Create a new PlatformUser:
	•	Email, Name (from invite or token).
	•	FirebaseUid from token.
	5.	Update UserTenantMembership
	•	Ensure a UserTenantMembership entry for:
	•	PlatformUserId
	•	TenantId
	•	Set Status = Active.
	6.	Mark invite as accepted
	•	TenantAdminInvite.Status = Accepted
	•	AcceptedAt = Now
	7.	Ensure tenant-level admin role
	•	In the TenantDB for this tenant:
	•	Ensure a TenantUser exists for this PlatformUserId.
	•	Ensure TenantUser has the CommunityAdmin (or equivalent) role/group assigned.
	9.	Backend returns a response like:

{
  "userId": "platform-user-id",
  "email": "admin@example.com",
  "tenants": [
    {
      "tenantId": "T123",
      "tenantName": "Green Meadows",
      "roles": [ "CommunityAdmin" ]
    }
  ]
}


⸻

After Acceptance – Normal Login Behaviour
	•	For all future logins:
	1.	User logs into Firebase with their email.
	2.	Frontend gets Firebase ID token.
	3.	Frontend calls /api/auth/me.
	4.	Backend:
	•	Validates token.
	•	Finds PlatformUser via FirebaseUid.
	•	Loads UserTenantMembership and tenant roles.
	5.	Response indicates the user is Community Admin of the corresponding tenant(s).
	•	The invite is a one-time onboarding step; afterwards:
	•	The user behaves like any other authenticated user with tenant admin rights.

---

### How we continue from here

- If you’re happy with this `savi-auth-flows.md`, save it into your repo.  
- Next time we define a new flow (e.g. **Resident invite & onboarding**), once you say “aligned”, you can tell me:

> “Update `savi-auth-flows.md`”

and I’ll regenerate the **whole file** with the new section added and you just paste it over the old one.

For now, since you said *“aligned”* on platform admin and we mostly aligned on community admin, you can review this doc, tweak naming if you want, and then we can move to:

> Resident onboarding via invite + Firebase (same auth context).