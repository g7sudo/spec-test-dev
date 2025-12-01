Nice, this is a good moment to lock down the structure + parking model before we move on to residents.

I’ll stay in this narrow scope:
	•	Community Admin first-time setup
	•	Specifically: Blocks → Floors → Units → Unit Types → Parking allocation

And I’ll document it in a way you can drop straight into your product docs.

⸻


# Community Structure & Parking Setup (Community Admin First-Time Config)

## 1. Goal

Define the **minimum data model + setup flow** a Community Admin must complete so that:

- Units are clearly defined (what flats exist).
- Each unit has a **flat type** (1BHK, 2BHK, Studio, Penthouse, etc.).
- Parking is configured and **allocated per unit** according to rules (e.g. 1 or 2 slots per type).

This must be done **before** inviting residents/owners, so the product can function properly.

---

## 2. Entities & Properties

### 2.1 Block / Building

Represents a physical building or tower in the community.

**Properties:**

- `BlockId` (internal ID)
- `Name` (e.g. "A", "Tower 1", "Block B")
- `Description` (optional)
- `DisplayOrder` (optional, for sorting)

---

### 2.2 Floor

Represents a floor within a block.

**Properties:**

- `FloorId` (internal ID)
- `BlockId` (FK → Block)
- `Name` (e.g. "G", "1", "2", "Penthouse", "B1" for basement)
- `LevelNumber` (integer, optional: e.g. 0 for G, 1,2,3,…)
- `DisplayOrder` (optional)

---

### 2.3 Unit

Represents an individual apartment/flat/villa within a floor.

**Properties:**

- `UnitId` (internal ID)
- `BlockId` (FK → Block)
- `FloorId` (FK → Floor)
- `UnitNumber` (e.g. "101", "A-3B", "PH-1")
- `UnitTypeId` (FK → UnitType, e.g. 1BHK, 2BHK, Studio, Penthouse)
- `AreaSqft` (optional)
- `Bedrooms` (optional; may be derived from UnitType)
- `Bathrooms` (optional)
- `Status` (e.g. Active, UnderConstruction, Inactive)
- `Notes` (optional, free text – e.g. “Corner unit, extra balcony”)

---

### 2.4 UnitType (Flat Type)

Represents a **category of unit**, used to standardize config such as parking allocation.

Examples: `STUDIO`, `1BHK`, `2BHK`, `3BHK`, `PENTHOUSE`.

**Properties:**

- `UnitTypeId` (internal ID)
- `Code` (e.g. `"STUDIO"`, `"1BHK"`, `"2BHK"`, `"PENTHOUSE"`)
- `DisplayName` (e.g. "Studio", "1 BHK", "Penthouse Suite")
- `DefaultParkingSlots` (integer; e.g. 1 for 1BHK, 2 for 3BHK, 2 for Penthouse)
- `Description` (optional)
- `DefaultOccupancyLimit` (optional, e.g. 2, 4, 6 – for future validation)

This allows the system to **auto-derive parking** and other rules from the flat type.

---

### 2.5 ParkingSlot

Represents an individual parking space in the community (covering basement, open, etc.).

**Properties:**

- `ParkingSlotId` (internal ID)
- `Code` (human label, e.g. "B1-12", "B2-45", "OPEN-07")
- `LocationType` (e.g. "BASEMENT", "PODIUM", "OPEN")
- `Level` (optional, e.g. "B1", "B2", "G")
- `IsCovered` (boolean; true for covered parking)
- `IsEVCompatible` (boolean; optional for future EV support)
- `Status` (e.g. Available, Reserved, OutOfService)
- `Notes` (optional)

**Allocation fields (unit mapping):**

- `AllocatedUnitId` (FK → Unit, nullable)
- `AllocatedFrom` (date/time, optional – if you ever need history)
- `AllocatedTo` (date/time, optional – for time-bound allocations; can be null for “current/ongoing”)

---

### 2.6 Unit-Parking Allocation (if you want separate mapping)

You can either:

- Store `AllocatedUnitId` in `ParkingSlot` directly  
  **or**
- Have a separate junction table like `UnitParkingAllocation` if you want history/flexibility.

**`UnitParkingAllocation` (optional, richer model):**

- `AllocationId`
- `UnitId`
- `ParkingSlotId`
- `AllocatedFrom`
- `AllocatedTo` (nullable for current)


---

## 3. Configuration Flow (Community Admin)

This is the **first-time setup flow** for structure + parking.

### Step 1 – Define Unit Types (Flat Types)

**Screen: “Flat Types”**

Community Admin defines or confirms the list of unit types.

**Inputs:**

For each type:

- `Code` (e.g. 1BHK, 2BHK, STUDIO, PENTHOUSE)
- `DisplayName`
- `DefaultParkingSlots` (1 or 2, etc.)
- Optional:
  - `Description`
  - `DefaultOccupancyLimit`

**Example configuration:**

- STUDIO → DefaultParkingSlots = 1  
- 1BHK → DefaultParkingSlots = 1  
- 2BHK → DefaultParkingSlots = 1 or 2 (depending on property policy)  
- 3BHK → DefaultParkingSlots = 2  
- PENTHOUSE → DefaultParkingSlots = 2  

These values become the **rules** for parking allocation later.

---

### Step 2 – Configure Blocks & Floors

**Screen: “Blocks & Floors”**

Community Admin:

1. Adds Blocks:
   - e.g. “Block A”, “Block B”, “Tower 1”, “Tower 2”.
2. For each Block, defines Floors:
   - Numbered or manually listed.
   - e.g. G, 1, 2, 3, 4, 5, PH.

**Data captured:**

- `Block` rows with `Name`, `Description`.
- `Floor` rows with `BlockId`, `Name`, `LevelNumber`.

---

### Step 3 – Create Units & Assign Unit Types

**Screen: “Units”**

For each floor, Community Admin defines the units:

- `UnitNumber` (e.g. 101, 102, A-3B)
- `UnitTypeId` (choose from previously defined types: 1BHK, 2BHK, etc.)
- Optional:
  - `AreaSqft`
  - Any custom notes.

**System behaviour:**

- When a `UnitType` is selected:
  - The system **knows** the `DefaultParkingSlots` expected for that unit.
  - This doesn’t allocate specific slots yet, but sets **expected count**.

**Stored data:**

- `Unit` rows with:
  - `BlockId`
  - `FloorId`
  - `UnitNumber`
  - `UnitTypeId`
  - `AreaSqft` (if provided)
  - etc.

---

### Step 4 – Define Parking Slots Inventory

**Screen: “Parking Inventory”**

Community Admin configures **all parking slots available in the community**.

For each slot:

- `Code` – what’s printed or used physically (e.g. “B1-12”)
- `LocationType` – BASEMENT / OPEN / PODIUM, etc.
- `Level` – e.g. B1, B2, G
- `IsCovered` – true/false
- `IsEVCompatible` – true/false (optional, future)
- `Status` – Available / OutOfService
- `Notes` – optional description

At the end of this, the system knows:

- Total parking capacity.
- A list of uniquely identifiable parking slots.

---

### Step 5 – Allocate Parking Slots to Units (Based on Unit Type Rules)

**Screen: “Allocate Parking”**

Now the system can **compare**:

- Total number of units per `UnitType`.
- Required slots = `sum(DefaultParkingSlots per unit)`.

**Process:**

1. For each Unit:
   - Expected slots = `UnitType.DefaultParkingSlots`.

2. Admin sees an **allocation UI**:

   - Left side: Units + required number (e.g. `Unit 101 (2BHK, needs 1 slot)`).
   - Right side: Available parking slots (e.g. `B1-12, B1-13, OPEN-01`).

3. Admin can:
   - Let the system **auto-allocate**:
     - E.g. allocate the next N free slots for each unit in some order.
   - Or manually map slots:
     - Select specific slots for high-value units (PH, etc.).

4. After allocation:
   - Each `ParkingSlot` receives:
     - `AllocatedUnitId = UnitId`  
     or a `UnitParkingAllocation` row is created.

**Data captured:**

- For each slot:
  - `AllocatedUnitId` (current allocation)
- System can derive:
  - For each unit:
    - Number of allocated parking slots.
    - Parking details for use in resident apps and admin views.

---

## 4. Minimum Required Data for Product to Run

For the **core product to function** (units + parking), the following must be present:

1. **At least one Block**
   - `BlockId`, `Name`.

2. **At least one Floor per Block**
   - `FloorId`, `BlockId`, `Name`.

3. **At least one Unit**
   - `UnitId`, `BlockId`, `FloorId`, `UnitNumber`, `UnitTypeId`.

4. **At least one UnitType**
   - `UnitTypeId`, `Code`, `DisplayName`, `DefaultParkingSlots`.

5. **(Optional but recommended) Parking slots inventory**
   - `ParkingSlotId`, `Code`, `LocationType`, `Status`.
   - Later required if you want to show exact parking slots in apps.

6. **(If you enforce allocation)** Allocations:
   - `AllocatedUnitId` on `ParkingSlot` or equivalent mapping in `UnitParkingAllocation`.

With this setup in place, the system can:

- Attach Owners/Residents to **Units**.
- Show each unit’s **flat type**.
- Show **how many and which parking slots** belong to each unit.
- Power downstream features:
  - Resident profile → show their unit + parking info.
  - Maintenance → requests tagged to unit (and optionally parking spot).
  - Future EV/parking features (guest parking, etc.).


⸻
