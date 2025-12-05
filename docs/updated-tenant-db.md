erDiagram

  PARTY {
    uuid Id
    string PartyType
    string Name
    // PII fields, etc.
  }

  COMMUNITY_USER {
    uuid Id
    uuid PartyId
    // login/account fields
  }

  UNIT {
    uuid Id
    string Code
    // block, floor, etc.
  }

  UNIT_OWNERSHIP {
    uuid Id
    uuid UnitId
    uuid PartyId
    date FromDate
    date ToDate
    bool IsPrimaryOwner
  }

  LEASE {
    uuid Id
    uuid UnitId
    date StartDate
    date EndDate
    string Status
  }

  LEASE_PARTY {
    uuid Id
    uuid LeaseId
    uuid PartyId
    string Role        // PrimaryResident, CoResident, Guarantor...
    bool IsPrimary
    date MoveInDate
    date MoveOutDate
  }

  MAINTENANCE_REQUEST {
    uuid Id
    uuid UnitId                // nullable for common area
    uuid RequestedForPartyId   // nullable
    uuid RequestedByUserId     // nullable
    uuid AssignedToUserId      // nullable
    uuid CreatedByUserId
    uuid UpdatedByUserId
    uuid CancelledByUserId     // nullable
    string Status
    string Title
  }

  RESIDENT_INVITE {
    uuid Id
    uuid LeaseId
    uuid PartyId
    uuid CreatedByUserId
    uuid AcceptedByUserId      // nullable
    string Role                // PrimaryResident / CoResident
    string Status              // Pending / Accepted / Expired / Cancelled
  }

  %% Relationships

  PARTY ||--o{ COMMUNITY_USER : "1 to 0..1 (per community)"
  PARTY ||--o{ UNIT_OWNERSHIP : "owns"
  UNIT  ||--o{ UNIT_OWNERSHIP : "is owned by"

  UNIT  ||--o{ LEASE          : "has leases"
  LEASE ||--o{ LEASE_PARTY    : "has parties"
  PARTY ||--o{ LEASE_PARTY    : "on leases as"

  UNIT  ||--o{ MAINTENANCE_REQUEST : "issue for"
  PARTY ||--o{ MAINTENANCE_REQUEST : "requested_for (Party)"
  COMMUNITY_USER ||--o{ MAINTENANCE_REQUEST : "requested_by / created_by / assigned_to"

  LEASE ||--o{ RESIDENT_INVITE : "invites for"
  PARTY ||--o{ RESIDENT_INVITE : "invited party"
  COMMUNITY_USER ||--o{ RESIDENT_INVITE : "created/accepted by"