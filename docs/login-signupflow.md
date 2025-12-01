“I just type my email/phone and log in. I don’t pick a tenant.
How does the system magically know which communities I belong to?”

Answer:
Because we already linked that identity to tenants earlier, and at login we just look up those links.

I’ll walk it slowly.

⸻

1. Two layers you already decided on

We have:
	1.	Identity (who is this person?)
	•	Managed by Firebase
	•	Key field: FirebaseUid + Email
	2.	Membership (which communities/tenants do they belong to?)
	•	Managed in PlatformDB (and detailed in TenantDB)
	•	Key table here: UserTenantMembership:
	•	PlatformUserId
	•	TenantId
	•	Status (Invited, Active, etc.)

So at login we do:
	•	“Who is this?” → ask Firebase
	•	“Where do they belong?” → query UserTenantMembership in PlatformDB

⸻

2. What happens at sign up / login (no tenant selection)

Step 1 – User signs in with Firebase
	•	In the mobile app or web app:
	•	User enters email/phone + password/OTP.
	•	Firebase:
	•	Authenticates them.
	•	Returns a Firebase ID token that says:
	•	FirebaseUid = ABC123
	•	Email = user@example.com

No tenant yet. Just identity.

Step 2 – Backend identifies the user

Backend receives the token and does:
	1.	Verifies token with Firebase.
	2.	Looks in PlatformDB → PlatformUser:
	•	“Do we have a user with this FirebaseUid (or this email)?”

If no:
	•	Create a PlatformUser row for them (global identity).
	•	Right now they belong to 0 tenants until we link them.

If yes:
	•	We already know their PlatformUserId.

Step 3 – Backend looks up their communities

Now backend checks membership:
	•	Query UserTenantMembership:
“Give me all rows where PlatformUserId = X and Status = Active.”

This returns zero or more tenants:
	•	If they are:
	•	Platform Admin → they may have no UserTenantMembership but have PlatformUserRole = PlatformAdmin.
	•	Community Admin / Resident → they will have one or more UserTenantMembership rows.

We join that with Tenant table to get nice names:
	•	TenantId
	•	Tenant.Name (e.g. “Green Meadows”, “Sunrise Heights”)
	•	Tenant.Status, Plan, etc.

This is how we know which communities they belong to.

Step 4 – Backend returns “your communities”

The /auth/me (or similar) response looks like:

{
  "userId": "platform-user-id",
  "email": "user@example.com",
  "tenants": [
    {
      "tenantId": "T1",
      "tenantName": "Green Meadows"
    },
    {
      "tenantId": "T2",
      "tenantName": "Sunrise Heights"
    }
  ]
}

The client app now knows:
	•	This user belongs to two communities.
	•	The app can show a “Choose community” screen.
	•	Once they pick one, the app sends X-Tenant-Id: T1 on all API calls.

⸻

3. Where does UserTenantMembership come from?

This is the part that happens before first login, and that’s what all those invite flows are for.

Case A – Community Admin invites Resident
	•	Community Admin goes to Unit → “Invite Primary Resident”.
	•	Backend:
	•	Finds/creates a PlatformUser using the email.
	•	Creates UserTenantMembership row:
	•	PlatformUserId = that user
	•	TenantId = this community
	•	Status = Invited

So even before the resident installs the app:
	•	PlatformDB already says:
	•	“user@example.com belongs to Tenant T1 (Invited).”

When resident later signs up with Firebase using that email:
	•	We connect Firebase user → PlatformUser → existing UserTenantMembership.
	•	Status flips from Invited → Active.

So at first login, when we query UserTenantMembership, we already have Tenant T1 there.

Case B – Same person is in two communities

Example: You live in your flat and also manage your parents’ flat.

Then, for same PlatformUserId:
	•	UserTenantMembership rows:

PlatformUserId	TenantId	Status
U123	T1	Active
U123	T2	Active



So on login, you see both T1 and T2 in your tenant list.

You never selected the tenants during login; we derived them from the membership table.

⸻

4. How do we get “resident details” after that?

Login only answers:
	•	“Who is this?” → PlatformUser
	•	“Which tenants?” → UserTenantMembership → Tenant list

When user picks a community (tenant):
	1.	App sends X-Tenant-Id: T1 in each request.
	2.	Backend:
	•	Uses T1 to choose the correct TenantDB (via Tenant.Provider + Tenant.ConnectionString).
	3.	In TenantDB, we look up resident details using the link to PlatformUser:
	•	TenantUser where PlatformUserId = X.
	•	Lease for that TenantUser.
	•	Unit, parking, etc.

So conceptually:
	•	Platform layer:
	•	“This person belongs to tenants T1 and T2.”
	•	Tenant layer:
	•	“In tenant T1, they are primary resident of Unit 301.”
	•	“In tenant T2, they are co-resident of Unit 905.”

⸻

5. What if a user just signs up from app with no invite?

In this architecture so far:
	•	A bare sign-up (no invite) just creates:
	•	PlatformUser in PlatformDB.
	•	No UserTenantMembership rows yet.

So after login:
	•	/auth/me returns:
	•	tenants: []
	•	The app could show:
	•	“You are not linked to any community yet.
Ask your community office to invite you.”

Or later we can add:
	•	“Join community via code” flow:
	•	You enter a community code or invite code from the admin.
	•	Backend then creates the UserTenantMembership and tenant data.

But core idea stays the same:
Tenants don’t come from auth provider.
Tenants come from membership records (created by invites or join flows).

⸻

6. One-sentence summary
	•	Login is global and tenant-agnostic: Firebase just tells us “this is user X”.
	•	The backend then queries PlatformDB to find all UserTenantMembership rows for that user.
	•	Those rows point to which communities/tenants they belong to.
	•	The app shows that list and, once they choose one, we use X-Tenant-Id + TenantDB to fetch resident/owner/role info.

