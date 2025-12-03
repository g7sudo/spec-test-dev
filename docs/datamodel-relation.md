Let’s restate your mental model in my words to be super clear:
	•	One Lease → one or many LeaseParty rows
	•	Each LeaseParty → exactly one Party
	•	That Party may or may not have a CommunityUser yet
	•	When you invite a resident / co-resident:
	•	They will eventually get a CommunityUser record
	•	That CommunityUser will point back to the same Party
	•	So from a Lease you can already reach the CommunityUser via:
Lease → LeaseParty → Party → CommunityUser

Which means:

✅ Yes: the CommunityUser is already reachable “in part from lease” through Party.
You do not need CommunityUserId on LeaseParty for correctness.

⸻

How the flow works step by step

1. Admin sets up lease and parties
	•	Admin creates a Lease for Unit 101.
	•	For each person on the lease (primary resident, spouse, etc.):
	•	Create / reuse a Party row.
	•	Create a LeaseParty row:
	•	LeaseId = that lease
	•	PartyId = that person’s Party
	•	Role = PrimaryResident / CoResident / Guarantor / etc.

At this point, none of them need an account yet. No CommunityUser is required.

2. Admin invites resident / co-resident to the app
	•	Admin clicks “Invite this resident”.
	•	You create an Invite (e.g. ResidentInvite) that links to:
	•	PartyId (or LeasePartyId)
	•	Email / phone

Still, no CommunityUser yet. The identity is the Party.

3. Resident accepts invite & signs up
	•	Resident opens the invite link, completes signup.
	•	You create a CommunityUser in that tenant:
	•	CommunityUser.PartyId = existing Party.Id (from the invite)
	•	You do not touch Lease or LeaseParty at all.
	•	They already point to the correct Party.

Now:
	•	From CommunityUser you can find their leases:
	•	CommunityUser → PartyId → LeaseParty → Lease.
	•	From Lease you can find which users (if any) have accounts:
	•	Lease → LeaseParty → Party → CommunityUser (0 or 1 row).

So yes: your understanding is bang on and the path is already there.

⸻

What I’d put in DBML for LeaseParty

Given this, I’d keep LeaseParty clean like this:

Table LeaseParty {
  Id        uuid [pk]
  LeaseId   uuid [not null, ref: > Lease.Id]
  PartyId   uuid [not null, ref: > Party.Id]

  Role        LeasePartyRole
  IsPrimary   bool [not null, default: false]
  MoveInDate  date
  MoveOutDate date

  CreatedAt         timestamp
  CreatedByUserId   uuid [ref: > CommunityUser.Id]
  UpdatedAt         timestamp
  UpdatedByUserId   uuid [ref: > CommunityUser.Id]
}

No CommunityUserId column here — you always go through Party.

Use CommunityUserId only where you really mean “which logged-in user performed this action”:
	•	CreatedByUserId, UpdatedByUserId
	•	ReportedByUserId, AssignedToUserId on MaintenanceRequest
	•	Audit / activity tables, etc.

⸻

TL;DR
	•	Your statement is correct:
Lease → LeaseParty → Party → CommunityUser is enough.
	•	LeaseParty doesn’t need its own CommunityUserId.
	•	Party is the canonical identity; CommunityUser is just “this Party has an app account in this community.”

