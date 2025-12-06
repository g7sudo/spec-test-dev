
1. Amenity Module – Community Admin

1.0 Preconditions
	•	Amenity data model exists:
	•	Amenity
	•	AmenityBooking
	•	Documents for amenity images (OwnerType = Amenity).

We’re now designing:

How a Community Admin configures the first set of amenities and booking rules.

⸻

Flow A – First-time Amenity Setup Checklist

Persona: Community Admin
	1.	Admin logs into Community Admin portal 
	2.	Admin clicks Amenities.
	3.	System shows empty state for Amenities:
	•	Message: “No amenities configured yet.”
	•	CTA: “Add Amenity”

⸻

Flow B – Create First Amenity (e.g., Party Hall)

Persona: Community Admin
Goal: Define 1 amenity, including booking rules.
	1.	Admin clicks “Add Amenity”.
	2.	Basic Details step:
	•	Name: “Party Hall”
	•	Type: select from AmenityType (e.g., Hall / Clubhouse / Court).
	•	Location: free text or reference to block (“Near Block A, Ground Floor”).
	•	Status: defaults to Active.
	•	Visibility: IsVisibleInApp = true (so residents can see it).
	•	Optional: Display order.
	3.	Booking Rules step:
	•	IsBookable = true
	•	RequiresApproval = true (for party halls).
	•	Time window:
	•	OpenTime = 09:00
	•	CloseTime = 22:00
	•	SlotDurationMinutes (e.g., 120 or 180)
	•	CleanupBufferMinutes (e.g., 30)
	•	MaxDaysInAdvance (e.g., 30 days)
	•	MaxActiveBookingsPerUnit (e.g., 2 upcoming bookings per unit)
	•	MaxGuests (e.g., 50)
	4.	Deposit & Payment Rules step (basic version):
	•	DepositRequired = true
	•	DepositAmount = 2000
	•	Note on UI: “Deposit is tracked manually; system only records status & reference.”
	5.	Review & Save:
	•	Summary page showing:
	•	Basic info
	•	Booking rules
	•	Deposit info
	6.	Admin clicks Save.
	7.	System creates the Amenity row with those fields and returns to Amenities List with one entry: “Party Hall”.

⸻

Flow C – Configure Additional Amenities via Templates

Once one amenity exists, we simplify creation of others.

Goal: Quickly create similar amenities (e.g., multiple courts) without re-entering all rules.
	1.	On Amenities List, admin clicks “Add Amenity” again.
	2.	UI offers:
	•	“Create from scratch”
	•	“Copy rules from existing amenity” (e.g., from Party Hall or Court1).
	3.	If “Copy from existing” selected:
	•	Choose source amenity.
	•	System pre-fills booking settings from that amenity.
	•	Admin only edits:
	•	Name (“Badminton Court 1”)
	•	Type (e.g., Court)
	•	Location
	•	Slight tweaks to rules if needed.
	4.	Save new amenity.
	5.	Repeat for:
	•	“Badminton Court 2”
	•	“Tennis Court”
	•	“Guest Suite” etc.

Result:
Within a few minutes, the community has a catalog of amenities, each with:
	•	Basic info
	•	Booking windows & rules
	•	Deposit behaviour
	•	Visibility flags

⸻

Flow D – Manage Amenity Images (use same as profile tempfile method to uplaod image)

Persona: Community Admin
Goal: Add photos for each amenity so residents recognize them.
	1.	In Amenities List, admin clicks an amenity row → detail page.
	2.	Open “Images” or “Gallery” tab.
	3.	Admin uploads:
	•	Cover photo
	•	Additional photos (inside, outside, rules board, etc.)
	4.	System stores them as Document rows:
	•	OwnerType = Amenity
	•	OwnerId = Amenity.Id
	•	IsPrimary, SortOrder, Url etc.

These images will be used in the mobile app amenity detail page.

⸻

Flow E – Change Availability (Close amenity temporarily)

separate blackout dates

Persona: Community Admin
Goal: Temporarily prevent new bookings while keeping history.
	1.	Admin opens amenity detail:
	•	Sees quick actions: “Mark Under Maintenance”, “Disable booking”, etc.
	2.	Options:
a) Amenity fully out of service (renovation):
	•	Set Status = UnderMaintenance.
	•	Optionally set IsBookable = false.
	•	In the app:
	•	Residents see it as “Unavailable” or don’t see it at all (depending on IsVisibleInApp).
b) Don’t allow bookings, but keep visible:
	•	Keep Status = Active.
	•	Set IsBookable = false.
	•	Residents see it but can’t submit new bookings (“Temporarily not bookable”).

Existing bookings:
	•	Admin manually cancels / adjusts them using cancellation flows; also auto cancel after blackout dates

⸻

1. Amenity Booking & Approval – Resident + Admin

Now that amenities exist, we define how they’re used.

Flow F – Resident books an amenity from mobile app

Persona: Resident (Primary or Co-resident with app access)
Goal: Use newly configured amenities.
	1.	Resident opens mobile app → “Amenities” tab.
	2.	App loads list of amenities where:
	•	IsVisibleInApp = true
	•	Status = Active (and maybe IsBookable filter for “bookable” section).
	3.	Resident taps “Party Hall” (amenity detail):
	•	Sees:
	•	Name, photos, description, location.
	•	Rules summary (max guests, booking window, deposit info).
	•	Availability preview.
	4.	Resident taps “Book”:
	•	App calls availability endpoint which applies by given from and to data
        Picks date.: choose availble slot (SlotDurationMinutes)
	•	Existing Approved bookings + buffer.
	•	MaxDaysInAdvance.
	5.	Resident selects a time slot:
	•	E.g., 5–8 PM.
	6.	Resident fills booking details:
	•	Title / purpose (e.g., “Birthday party”)
	•	NumberOfGuests
	•	Optional note.
	7.	App shows a summary:
	•	Date/time
	•	Amenity
	•	Deposit required and amount.
	•	Info: “This booking requires admin approval” (from RequiresApproval).
	8.	Resident confirms.
	9.	System creates an AmenityBooking row:
	•	Tied to:
	•	AmenityId
	•	UnitId of the resident’s current lease
	•	BookedForUserId = resident’s CommunityUser
	•	Status = PendingApproval (because RequiresApproval = true)
	•	Source = MobileApp
	•	DepositRequired / DepositAmount snapshot from Amenity

Resident now sees this booking in “My Bookings” as Pending Approval.

⸻

Flow G – Admin sees & approves/rejects booking

This is the high-level journey, keeping it simple:

Persona: Community Admin / Staff
Goal: Review resident-submitted bookings and decide.
	1.	Admin goes to Bookings → Pending in admin portal.
	2.	Sees list of Pending requests:
	•	Amenity, date/time
	•	Unit & resident
	•	Guests count
	•	Source = MobileApp
	3.	Admin clicks a booking row to see details (as described previously):
	•	Amenity, rules
	•	Resident & unit
	•	Booking info
	•	Deposit info
	4.	Admin decides:
Approve:
	•	Confirms the slot is valid.
	•	Clicks Approve.
	•	Booking Status → Approved.
	•	ApprovedAt, ApprovedByUserId updated.
	•	Resident gets notification: “Booking approved.”
Reject:
	•	Clicks Reject.
	•	Must provide RejectionReason.
	•	Booking Status → Rejected.
	•	RejectedAt, RejectedByUserId, RejectionReason set.
	•	Resident gets notification: “Booking rejected – .”
	5.	On resident app:
	•	“My Bookings” reflect updated status (Approved / Rejected).
	•	Approved bookings appear clearly in their upcoming schedule.

⸻

Flow H – Auto-approval variant (for small amenities)

For some amenities (like Gym Slot, Study Room) the admin may not want to manually approve everything.

In that case, for such amenities:
	•	RequiresApproval = false.

Resident flow is the same, but:
	•	When resident submits, system sets Status = Approved directly.
	•	No step with “PendingApproval” and no admin review required.

Admin still sees bookings in list/calendar, but only for monitoring.

⸻

1. Combined high-level diagram

Here’s a Mermaid flowchart showing:
	•	Admin greenfield setup
	•	Resident booking
	•	Admin approval

flowchart TD

  subgraph ADMIN_SETUP[Community Admin - Setup]
    A0[Admin logs in\nSees Setup Checklist] --> A1[Open Amenities module]
    A1 --> A2[Add Amenity\n(Basic info)]
    A2 --> A3[Configure Booking Rules\n(times, slot, limits)]
    A3 --> A4[Configure Deposit\n(required?, amount)]
    A4 --> A5[Save Amenity]
    A5 --> A6[Repeat for more amenities\n(Party Hall, Courts, etc.)]
    A6 --> A7[Optional: Upload Images\nfor each amenity]
  end

  subgraph RESIDENT_FLOW[Resident - Mobile App]
    R1[Resident opens app\nAmenities tab] --> R2[View list of amenities]
    R2 --> R3[Open Amenity details]
    R3 --> R4[Select Date & Time Slot]
    R4 --> R5[Enter purpose, guests, notes]
    R5 --> R6[Confirm Booking]
    R6 --> R7[Booking created\nStatus: PendingApproval or Approved(auto)]
  end

  subgraph ADMIN_APPROVAL[Community Admin - Booking Approval]
    B1[Admin opens\nBookings - Pending] --> B2[View Pending Booking details]
    B2 --> B3{Requires Approval?}
    B3 -->|No| B6[Booking already Approved\nauto by system]
    B3 -->|Yes| B4[Approve\nStatus -> Approved]
    B3 -->|Yes| B5[Reject\nStatus -> Rejected\n+ reason]
  end

  A6 --> R1
  R7 --> B1

