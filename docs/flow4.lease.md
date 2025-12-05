Perfect, let’s lock in “Lease for a Unit” as its own flow and then it will naturally hand off into your existing flow3-residentflow (resident invite / onboarding).

I’ll describe it in plain steps and also give you a Mermaid diagram you can paste into docs.

⸻

Lease flow – what we’re agreeing on

Roles / assumptions
	•	Community Admin is the main actor.
	•	Owner already exists in the system as a Party and via UnitOwnership.
	•	New Tenant / Residents may not exist yet as users – we’ll first create them as Party, then later they get CommunityUser via invites.

Key rule:

Lease & LeaseParty always work with Party first.
Resident accounts (CommunityUser) are created later via ResidentInvite.

⸻

Step-by-step flow for “Create lease for a unit”

0. Entry point: Unit view

From Unit details page (e.g. Unit 101):
	•	Show:
	•	Current owner(s) (from UnitOwnership → Party)
	•	Current lease (if any, from Lease + LeaseParty)
	•	Actions:
	•	Create Lease (if no active lease)
	•	Or Create New Lease (move-in) with warning/override if an active lease already exists.

⸻

1. Initialize Lease (choose owner & basic info)

Actor: Community Admin
	1.	Admin clicks “Create Lease” on the Unit.
	2.	System:
	•	Prefills Owner Party for this lease from UnitOwnership:
	•	UnitOwnership (active, primary) → OwnerPartyId
	•	Starts a new Lease in Draft:
	•	Lease.UnitId = Unit.Id
	•	Lease.Status = Draft
	•	Lease.OwnerPartyId = OwnerPartyId (optional field, but useful)
	3.	Admin confirms owner (or overrides if needed – multiple owners / corporate owner).

At this point, you have a Draft Lease, no tenants yet.

⸻

2. Add Lease Parties (future residents/guarantors as Parties)

Still in Lease Draft:
	1.	In a “Lease Parties” step/screen, admin adds people involved:
	•	Primary Resident
	•	Optional Co-Residents
	•	Optional Guarantor / company / etc.
	2.	For each person:
	•	Admin either:
	•	Selects existing Party (e.g. existing owner’s family already in system), or
	•	Creates new Party (minimal info: name, email/phone).
	3.	For each selected/created Party, system creates a LeaseParty row:
	•	LeaseParty.LeaseId = Lease.Id
	•	LeaseParty.PartyId = that Party.Id
	•	LeaseParty.Role = PrimaryResident / CoResident / Guarantor / …
	•	LeaseParty.IsPrimary = true for exactly one PrimaryResident
	•	MoveInDate can be set now or later (e.g. same as Lease.StartDate)

Important:
	•	No CommunityUser yet is required here – everything is purely Party + LeaseParty.

⸻

3. Define Lease terms

Lease terms screen:
	•	Admin fills:
	•	Lease.StartDate, Lease.EndDate (optional/fixed/rolling)
	•	Rent amount, deposit, payment frequency, billing references, etc. (as per your domain)
	•	Optional: attach documents (scanned contract, addendums)
	•	System keeps Lease.Status = Draft until admin explicitly reviews & approves.

⸻

4. Review & approve Lease

Review screen summarises:
	•	Unit details
	•	Owner(s)
	•	Lease terms
	•	Parties (primary resident, co-residents, guarantors)

Validation before approve:
	•	At least one PrimaryResident LeaseParty exists.
	•	Optional: no overlapping Active lease for this Unit, unless admin explicitly overrides.
	•	Lease.StartDate present.

When admin clicks “Approve & Activate Lease”:
	1.	Lease.Status → Active
	2.	Lease.ActivatedAt (optional audit field)
	3.	LeaseParty.IsActive = true for all active parties (or simply rely on IsActive/dates)

At this moment, the legal/operational lease is “live” in the system, but residents might still not have app accounts.

⸻

5. Trigger resident invites (handoff to flow3)

Now that the lease is Active, we tie into your existing flow3-residentflow.md.

From the Lease screen, after activation:
	1.	System prompts:
	•	“Send invites to residents now?”
	•	Show all LeaseParty rows with Role in [PrimaryResident, CoResident].
	2.	For each LeaseParty (Party) admin chooses to invite:
	•	System creates a ResidentInvite:
	•	ResidentInvite.LeaseId = Lease.Id
	•	ResidentInvite.PartyId = LeaseParty.PartyId
	•	ResidentInvite.Role = LeaseParty.Role
	•	Email/Phone from PartyContact (or manually entered)
	•	Status = Pending, Token = random
	3.	System sends SMS/email with invite link.

Then your existing resident flow (flow3) kicks in:
	•	Resident clicks invite link → signs up via Firebase → backend:
	•	Creates CommunityUser for that tenant:
	•	CommunityUser.PartyId = PartyId from ResidentInvite
	•	Optionally links to Lease/LeaseParty for contextual onboarding (dashboard shows “Welcome to Unit 101”).

So:

Lease flow ends at: “Lease Active + ResidentInvites created.”
Then flow3 takes over to manage user signup and app access.

⸻

Mermaid: Lease flow (high-level)

Here’s a Mermaid flowchart capturing the lease journey up to the point where flow3 starts:

flowchart TD

  A[Unit details page] -->|Create Lease| B[Init Lease (Draft)]
  B --> C[Select/Confirm Owner (from UnitOwnership)]
  C --> D[Add Lease Parties (Party)]
  D --> E[Set Lease Terms (Start/End, Rent, etc.)]
  E --> F[Review Lease Summary]

  F -->|Approve & Activate| G[Lease.Status = Active]

  G --> H{Send Resident Invites?}
  H -->|Yes| I[Create ResidentInvite for each LeaseParty (Party)]
  H -->|No| J[Lease Active with parties, no invites yet]

  I --> K[Resident receives invite link]
  K --> L[flow3-residentflow.md\n(Resident signup & onboarding)]

  J --> L


⸻

	•	Add Lease.Status enum + key fields into your DBML in a concrete way, and
	•	Define the ResidentInvite table exactly to match this flow.