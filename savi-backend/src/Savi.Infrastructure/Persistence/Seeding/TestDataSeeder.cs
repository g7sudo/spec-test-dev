using Bogus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Commands.SeedTestData;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.Infrastructure.Persistence.TenantDb;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds test/demo data for a tenant database.
/// Uses Bogus library for generating realistic fake data.
/// </summary>
public class TestDataSeeder : ITestDataSeeder
{
    private readonly TenantDbContext _dbContext;
    private readonly ILogger<TestDataSeeder> _logger;
    private readonly Faker _faker;

    private Guid _systemUserId;
    private const string PlaceholderImageUrl = "https://placehold.co/250x150@3x.png";

    // Stats tracking
    private int _blocksCreated;
    private int _floorsCreated;
    private int _unitsCreated;
    private int _parkingSlotsCreated;
    private int _partiesCreated;
    private int _ownershipsCreated;
    private int _leasesCreated;
    private int _amenitiesCreated;

    public TestDataSeeder(
        TenantDbContext dbContext,
        ILogger<TestDataSeeder> logger)
    {
        _dbContext = dbContext;
        _faker = new Faker();
        // Set seed for reproducibility in test data
        Randomizer.Seed = new Random(42);
        _logger = logger;
    }

    /// <summary>
    /// Gets the first CommunityUser ID to use for audit fields.
    /// </summary>
    private async Task<Guid> Get_systemUserIdAsync(CancellationToken cancellationToken)
    {
        var user = await _dbContext.CommunityUsers
            .OrderBy(u => u.CreatedAt)
            .Select(u => u.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == Guid.Empty)
        {
            throw new InvalidOperationException(
                "No CommunityUser found in the database. Please ensure at least one user exists before seeding test data.");
        }

        _logger.LogInformation("Using CommunityUser {UserId} for test data seeding", user);
        return user;
    }

    /// <summary>
    /// Seeds all test data for the tenant.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting test data seeding...");

        // Check if test data already exists
        var hasBlocks = await _dbContext.Blocks.AnyAsync(cancellationToken);
        if (hasBlocks)
        {
            _logger.LogInformation("Test data already exists. Skipping seed.");
            return;
        }

        // Get system user ID for audit fields
        _systemUserId = await Get_systemUserIdAsync(cancellationToken);

        // Seed in order of dependencies
        var unitTypes = await GetOrSeedUnitTypesAsync(cancellationToken);
        var blocks = await SeedBlocksAsync(cancellationToken);
        var floors = await SeedFloorsAsync(blocks, cancellationToken);
        var units = await SeedUnitsAsync(blocks, floors, unitTypes, cancellationToken);
        var parkingSlots = await SeedParkingSlotsAsync(units, cancellationToken);
        var parties = await SeedPartiesAsync(cancellationToken);
        await SeedOwnershipAndLeasesAsync(units, parties, cancellationToken);
        await SeedAmenitiesAsync(cancellationToken);

        _logger.LogInformation("Test data seeding completed successfully");
    }

    /// <inheritdoc />
    public async Task<SeedTestDataStats> SeedWithStatsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting test data seeding with stats...");

        // Reset stats
        _blocksCreated = 0;
        _floorsCreated = 0;
        _unitsCreated = 0;
        _parkingSlotsCreated = 0;
        _partiesCreated = 0;
        _ownershipsCreated = 0;
        _leasesCreated = 0;
        _amenitiesCreated = 0;

        // Check if test data already exists
        var hasBlocks = await _dbContext.Blocks.AnyAsync(cancellationToken);
        if (hasBlocks)
        {
            _logger.LogInformation("Test data already exists. Skipping seed.");
            return new SeedTestDataStats
            {
                BlocksCreated = 0,
                FloorsCreated = 0,
                UnitsCreated = 0,
                ParkingSlotsCreated = 0,
                PartiesCreated = 0,
                OwnershipsCreated = 0,
                LeasesCreated = 0,
                AmenitiesCreated = 0
            };
        }

        // Get system user ID for audit fields
        _systemUserId = await Get_systemUserIdAsync(cancellationToken);

        // Seed in order of dependencies
        var unitTypes = await GetOrSeedUnitTypesAsync(cancellationToken);
        var blocks = await SeedBlocksAsync(cancellationToken);
        _blocksCreated = blocks.Count;

        var floors = await SeedFloorsAsync(blocks, cancellationToken);
        _floorsCreated = floors.Count;

        var units = await SeedUnitsAsync(blocks, floors, unitTypes, cancellationToken);
        _unitsCreated = units.Count;

        var parkingSlots = await SeedParkingSlotsAsync(units, cancellationToken);
        _parkingSlotsCreated = parkingSlots.Count;

        var parties = await SeedPartiesAsync(cancellationToken);
        _partiesCreated = parties.Count;

        var (ownerships, leases) = await SeedOwnershipAndLeasesWithStatsAsync(units, parties, cancellationToken);
        _ownershipsCreated = ownerships;
        _leasesCreated = leases;

        var amenities = await SeedAmenitiesWithCountAsync(cancellationToken);
        _amenitiesCreated = amenities;

        _logger.LogInformation("Test data seeding completed successfully");

        return new SeedTestDataStats
        {
            BlocksCreated = _blocksCreated,
            FloorsCreated = _floorsCreated,
            UnitsCreated = _unitsCreated,
            ParkingSlotsCreated = _parkingSlotsCreated,
            PartiesCreated = _partiesCreated,
            OwnershipsCreated = _ownershipsCreated,
            LeasesCreated = _leasesCreated,
            AmenitiesCreated = _amenitiesCreated
        };
    }

    private async Task<List<UnitType>> GetOrSeedUnitTypesAsync(CancellationToken cancellationToken)
    {
        var unitTypes = await _dbContext.UnitTypes.ToListAsync(cancellationToken);
        if (unitTypes.Count > 0)
        {
            return unitTypes;
        }

        // Unit types should be seeded by TenantDataSeeder, but if not, create minimal set
        _logger.LogWarning("UnitTypes not found, creating minimal set for test data");

        var types = new List<UnitType>
        {
            UnitType.Create("1BHK", "1 BHK", "One bedroom", 1, 2, _systemUserId),
            UnitType.Create("2BHK", "2 BHK", "Two bedrooms", 1, 4, _systemUserId),
            UnitType.Create("3BHK", "3 BHK", "Three bedrooms", 2, 6, _systemUserId)
        };

        _dbContext.UnitTypes.AddRange(types);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return types;
    }

    private async Task<List<Block>> SeedBlocksAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding blocks...");

        var blocks = new List<Block>
        {
            Block.Create("Tower A", "Main residential tower with 10 floors", 1, _systemUserId),
            Block.Create("Tower B", "Secondary residential tower with 8 floors", 2, _systemUserId),
            Block.Create("Tower C", "Premium residential tower with 12 floors", 3, _systemUserId)
        };

        _dbContext.Blocks.AddRange(blocks);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} blocks", blocks.Count);
        return blocks;
    }

    private async Task<List<Floor>> SeedFloorsAsync(List<Block> blocks, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding floors...");

        var floors = new List<Floor>();
        var floorsPerBlock = new Dictionary<string, int>
        {
            { "Tower A", 10 },
            { "Tower B", 8 },
            { "Tower C", 12 }
        };

        foreach (var block in blocks)
        {
            var floorCount = floorsPerBlock.GetValueOrDefault(block.Name, 5);

            // Add ground floor
            floors.Add(Floor.Create(block.Id, "Ground Floor", 0, 0, _systemUserId));

            // Add numbered floors
            for (int i = 1; i <= floorCount; i++)
            {
                floors.Add(Floor.Create(block.Id, $"Floor {i}", i, i, _systemUserId));
            }
        }

        _dbContext.Floors.AddRange(floors);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} floors", floors.Count);
        return floors;
    }

    private async Task<List<Unit>> SeedUnitsAsync(
        List<Block> blocks,
        List<Floor> floors,
        List<UnitType> unitTypes,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding units...");

        var units = new List<Unit>();
        var random = new Random(42); // Fixed seed for reproducibility

        foreach (var block in blocks)
        {
            var blockFloors = floors.Where(f => f.BlockId == block.Id && f.LevelNumber > 0).ToList();

            foreach (var floor in blockFloors)
            {
                // 4 units per floor
                for (int unitNum = 1; unitNum <= 4; unitNum++)
                {
                    var unitType = unitTypes[random.Next(unitTypes.Count)];
                    var unitNumber = $"{block.Name.Replace("Tower ", "")}{floor.LevelNumber:D2}{unitNum:D2}";
                    var areaSqft = unitType.Code switch
                    {
                        "1BHK" => 650 + random.Next(100),
                        "2BHK" => 950 + random.Next(150),
                        "3BHK" => 1350 + random.Next(200),
                        _ => 800 + random.Next(100)
                    };

                    units.Add(Unit.Create(
                        blockId: block.Id,
                        floorId: floor.Id,
                        unitTypeId: unitType.Id,
                        unitNumber: unitNumber,
                        areaSqft: areaSqft,
                        status: UnitStatus.Active,
                        notes: null,
                        createdBy: _systemUserId));
                }
            }
        }

        _dbContext.Units.AddRange(units);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} units", units.Count);
        return units;
    }

    private async Task<List<ParkingSlot>> SeedParkingSlotsAsync(List<Unit> units, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding parking slots...");

        var parkingSlots = new List<ParkingSlot>();
        var random = new Random(42);

        // Create basement parking slots
        for (int level = 1; level <= 2; level++)
        {
            for (int slot = 1; slot <= 50; slot++)
            {
                var isEV = slot <= 5; // First 5 slots per level are EV compatible
                parkingSlots.Add(ParkingSlot.Create(
                    code: $"B{level}-{slot:D3}",
                    locationType: ParkingLocationType.Basement,
                    levelLabel: $"Basement {level}",
                    isCovered: true,
                    isEVCompatible: isEV,
                    status: ParkingStatus.Available,
                    notes: isEV ? "EV charging available" : null,
                    createdBy: _systemUserId));
            }
        }

        // Create open parking slots
        for (int slot = 1; slot <= 30; slot++)
        {
            parkingSlots.Add(ParkingSlot.Create(
                code: $"P-{slot:D3}",
                locationType: ParkingLocationType.Open,
                levelLabel: "Ground Level",
                isCovered: false,
                isEVCompatible: false,
                status: ParkingStatus.Available,
                notes: null,
                createdBy: _systemUserId));
        }

        _dbContext.ParkingSlots.AddRange(parkingSlots);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Allocate some parking slots to units
        var availableSlots = parkingSlots.Where(p => p.Status == ParkingStatus.Available).ToList();
        var unitsToAllocate = units.Take(Math.Min(units.Count, availableSlots.Count / 2)).ToList();

        for (int i = 0; i < unitsToAllocate.Count; i++)
        {
            availableSlots[i].AllocateToUnit(unitsToAllocate[i].Id, _systemUserId);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} parking slots", parkingSlots.Count);
        return parkingSlots;
    }

    private async Task<List<Party>> SeedPartiesAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding parties...");

        var parties = new List<Party>();

        // Create individual parties (residents/owners) using Bogus
        for (int i = 0; i < 50; i++)
        {
            var firstName = _faker.Name.FirstName();
            var lastName = _faker.Name.LastName();
            var fullName = $"{firstName} {lastName}";
            var dateOfBirth = DateOnly.FromDateTime(_faker.Date.Past(40, DateTime.Today.AddYears(-25)));

            parties.Add(Party.CreateIndividual(
                firstName: firstName,
                lastName: lastName,
                partyName: fullName,
                legalName: null,
                dateOfBirth: dateOfBirth,
                notes: null,
                createdBy: _systemUserId));
        }

        // Create company parties using Bogus
        for (int i = 0; i < 5; i++)
        {
            var companyName = _faker.Company.CompanyName() + " " + _faker.PickRandom("LLC", "Inc", "Corp", "Holdings", "Properties");
            var regNumber = $"REG-{_faker.Random.Number(10000, 99999)}";
            var taxNumber = $"TAX-{_faker.Random.Number(10000, 99999)}";

            parties.Add(Party.CreateCompanyOrEntity(
                partyType: PartyType.Company,
                partyName: companyName,
                legalName: companyName,
                registrationNumber: regNumber,
                taxNumber: taxNumber,
                notes: "Corporate property owner",
                createdBy: _systemUserId));
        }

        _dbContext.Parties.AddRange(parties);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} parties", parties.Count);
        return parties;
    }

    private async Task SeedOwnershipAndLeasesAsync(
        List<Unit> units,
        List<Party> parties,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding ownership and leases...");

        var random = new Random(42);
        var individualParties = parties.Where(p => p.PartyType == PartyType.Individual).ToList();
        var companyParties = parties.Where(p => p.PartyType == PartyType.Company).ToList();

        var ownerships = new List<UnitOwnership>();
        var leases = new List<Lease>();
        var leaseParties = new List<LeaseParty>();

        var partyIndex = 0;
        foreach (var unit in units)
        {
            // 70% owned by individuals, 30% by companies
            var isCompanyOwned = random.NextDouble() > 0.7 && companyParties.Count > 0;
            var owner = isCompanyOwned
                ? companyParties[random.Next(companyParties.Count)]
                : individualParties[partyIndex++ % individualParties.Count];

            // Create ownership
            var ownershipStartDate = DateOnly.FromDateTime(DateTime.Today.AddYears(-random.Next(1, 5)));
            ownerships.Add(UnitOwnership.Create(
                unitId: unit.Id,
                partyId: owner.Id,
                ownershipShare: 100,
                fromDate: ownershipStartDate,
                isPrimaryOwner: true,
                createdBy: _systemUserId));

            // 60% of units are rented
            if (random.NextDouble() > 0.4 && individualParties.Count > partyIndex)
            {
                var tenant = individualParties[partyIndex++ % individualParties.Count];
                var leaseStartDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(-random.Next(1, 24)));
                var leaseEndDate = leaseStartDate.AddYears(1);

                var lease = Lease.Create(
                    unitId: unit.Id,
                    startDate: leaseStartDate,
                    endDate: leaseEndDate,
                    monthlyRent: 1500 + random.Next(3000),
                    depositAmount: 3000 + random.Next(5000),
                    notes: null,
                    createdBy: _systemUserId);

                // Activate the lease
                lease.Activate(_systemUserId);

                leases.Add(lease);

                // Add primary resident
                var leaseParty = LeaseParty.Create(
                    leaseId: lease.Id,
                    partyId: tenant.Id,
                    role: LeasePartyRole.PrimaryResident,
                    isPrimary: true,
                    moveInDate: leaseStartDate,
                    createdBy: _systemUserId);

                leaseParties.Add(leaseParty);

                // 30% chance of having a co-resident
                if (random.NextDouble() > 0.7 && individualParties.Count > partyIndex)
                {
                    var coResident = individualParties[partyIndex++ % individualParties.Count];
                    leaseParties.Add(LeaseParty.Create(
                        leaseId: lease.Id,
                        partyId: coResident.Id,
                        role: LeasePartyRole.CoResident,
                        isPrimary: false,
                        moveInDate: leaseStartDate,
                        createdBy: _systemUserId));
                }
            }
        }

        _dbContext.UnitOwnerships.AddRange(ownerships);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.Leases.AddRange(leases);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.LeaseParties.AddRange(leaseParties);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {OwnershipCount} ownerships, {LeaseCount} leases, {LeasePartyCount} lease parties",
            ownerships.Count, leases.Count, leaseParties.Count);
    }

    private async Task SeedAmenitiesAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding amenities...");

        var amenities = new List<Amenity>
        {
            Amenity.Create(
                name: "Party Hall - Grand Ballroom",
                code: "PHALL1",
                type: AmenityType.PartyHall,
                description: "Spacious party hall with a capacity of 100 guests. Features air conditioning, sound system, and catering area.",
                locationText: "Tower A, Ground Floor",
                isVisibleInApp: true,
                displayOrder: 1,
                isBookable: true,
                requiresApproval: true,
                slotDurationMinutes: 240,
                openTime: new TimeOnly(9, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 60,
                maxDaysInAdvance: 30,
                maxActiveBookingsPerUnit: 2,
                maxGuests: 100,
                depositRequired: true,
                depositAmount: 500,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Swimming Pool",
                code: "POOL1",
                type: AmenityType.Other,
                description: "Olympic-sized swimming pool with separate kids pool. Lifeguard on duty during operating hours.",
                locationText: "Podium Level, Near Tower B",
                isVisibleInApp: true,
                displayOrder: 2,
                isBookable: false,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(6, 0),
                closeTime: new TimeOnly(21, 0),
                cleanupBufferMinutes: 0,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: null,
                maxGuests: null,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Fitness Center",
                code: "GYM1",
                type: AmenityType.GymRoom,
                description: "State-of-the-art fitness center with cardio equipment, free weights, and personal training area.",
                locationText: "Tower A, Level 1",
                isVisibleInApp: true,
                displayOrder: 3,
                isBookable: false,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(5, 0),
                closeTime: new TimeOnly(23, 0),
                cleanupBufferMinutes: 0,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: null,
                maxGuests: null,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Tennis Court 1",
                code: "TENNIS1",
                type: AmenityType.Court,
                description: "Professional tennis court with flood lights for evening play.",
                locationText: "Near Tower C",
                isVisibleInApp: true,
                displayOrder: 4,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(6, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 15,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: 3,
                maxGuests: 4,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Tennis Court 2",
                code: "TENNIS2",
                type: AmenityType.Court,
                description: "Professional tennis court with flood lights for evening play.",
                locationText: "Near Tower C",
                isVisibleInApp: true,
                displayOrder: 5,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(6, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 15,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: 3,
                maxGuests: 4,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "BBQ Area",
                code: "BBQ1",
                type: AmenityType.BBQArea,
                description: "Outdoor BBQ area with grills, seating, and covered pavilion.",
                locationText: "Garden Area, Near Pool",
                isVisibleInApp: true,
                displayOrder: 6,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 180,
                openTime: new TimeOnly(11, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 30,
                maxDaysInAdvance: 14,
                maxActiveBookingsPerUnit: 2,
                maxGuests: 20,
                depositRequired: true,
                depositAmount: 100,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Meeting Room - Boardroom",
                code: "MEET1",
                type: AmenityType.MeetingRoom,
                description: "Professional meeting room with video conferencing equipment and whiteboard.",
                locationText: "Tower A, Level 2",
                isVisibleInApp: true,
                displayOrder: 7,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(8, 0),
                closeTime: new TimeOnly(20, 0),
                cleanupBufferMinutes: 15,
                maxDaysInAdvance: 14,
                maxActiveBookingsPerUnit: 5,
                maxGuests: 12,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Children's Play Area",
                code: "PLAY1",
                type: AmenityType.Other,
                description: "Safe indoor play area for children with toys and soft play equipment.",
                locationText: "Tower B, Ground Floor",
                isVisibleInApp: true,
                displayOrder: 8,
                isBookable: false,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(9, 0),
                closeTime: new TimeOnly(19, 0),
                cleanupBufferMinutes: 0,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: null,
                maxGuests: null,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId)
        };

        _dbContext.Amenities.AddRange(amenities);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} amenities", amenities.Count);
    }

    private async Task<(int ownerships, int leases)> SeedOwnershipAndLeasesWithStatsAsync(
        List<Unit> units,
        List<Party> parties,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding ownership and leases...");

        var random = new Random(42);
        var individualParties = parties.Where(p => p.PartyType == PartyType.Individual).ToList();
        var companyParties = parties.Where(p => p.PartyType == PartyType.Company).ToList();

        var ownerships = new List<UnitOwnership>();
        var leases = new List<Lease>();
        var leaseParties = new List<LeaseParty>();

        var partyIndex = 0;
        foreach (var unit in units)
        {
            // 70% owned by individuals, 30% by companies
            var isCompanyOwned = random.NextDouble() > 0.7 && companyParties.Count > 0;
            var owner = isCompanyOwned
                ? companyParties[random.Next(companyParties.Count)]
                : individualParties[partyIndex++ % individualParties.Count];

            // Create ownership
            var ownershipStartDate = DateOnly.FromDateTime(DateTime.Today.AddYears(-random.Next(1, 5)));
            ownerships.Add(UnitOwnership.Create(
                unitId: unit.Id,
                partyId: owner.Id,
                ownershipShare: 100,
                fromDate: ownershipStartDate,
                isPrimaryOwner: true,
                createdBy: _systemUserId));

            // 60% of units are rented
            if (random.NextDouble() > 0.4 && individualParties.Count > partyIndex)
            {
                var tenant = individualParties[partyIndex++ % individualParties.Count];
                var leaseStartDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(-random.Next(1, 24)));
                var leaseEndDate = leaseStartDate.AddYears(1);

                var lease = Lease.Create(
                    unitId: unit.Id,
                    startDate: leaseStartDate,
                    endDate: leaseEndDate,
                    monthlyRent: 1500 + random.Next(3000),
                    depositAmount: 3000 + random.Next(5000),
                    notes: null,
                    createdBy: _systemUserId);

                // Activate the lease
                lease.Activate(_systemUserId);

                leases.Add(lease);

                // Add primary resident
                var leaseParty = LeaseParty.Create(
                    leaseId: lease.Id,
                    partyId: tenant.Id,
                    role: LeasePartyRole.PrimaryResident,
                    isPrimary: true,
                    moveInDate: leaseStartDate,
                    createdBy: _systemUserId);

                leaseParties.Add(leaseParty);

                // 30% chance of having a co-resident
                if (random.NextDouble() > 0.7 && individualParties.Count > partyIndex)
                {
                    var coResident = individualParties[partyIndex++ % individualParties.Count];
                    leaseParties.Add(LeaseParty.Create(
                        leaseId: lease.Id,
                        partyId: coResident.Id,
                        role: LeasePartyRole.CoResident,
                        isPrimary: false,
                        moveInDate: leaseStartDate,
                        createdBy: _systemUserId));
                }
            }
        }

        _dbContext.UnitOwnerships.AddRange(ownerships);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.Leases.AddRange(leases);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.LeaseParties.AddRange(leaseParties);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {OwnershipCount} ownerships, {LeaseCount} leases, {LeasePartyCount} lease parties",
            ownerships.Count, leases.Count, leaseParties.Count);

        return (ownerships.Count, leases.Count);
    }

    private async Task<int> SeedAmenitiesWithCountAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding amenities...");

        var amenities = new List<Amenity>
        {
            Amenity.Create(
                name: "Party Hall - Grand Ballroom",
                code: "PHALL1",
                type: AmenityType.PartyHall,
                description: "Spacious party hall with a capacity of 100 guests. Features air conditioning, sound system, and catering area.",
                locationText: "Tower A, Ground Floor",
                isVisibleInApp: true,
                displayOrder: 1,
                isBookable: true,
                requiresApproval: true,
                slotDurationMinutes: 240,
                openTime: new TimeOnly(9, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 60,
                maxDaysInAdvance: 30,
                maxActiveBookingsPerUnit: 2,
                maxGuests: 100,
                depositRequired: true,
                depositAmount: 500,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Swimming Pool",
                code: "POOL1",
                type: AmenityType.Other,
                description: "Olympic-sized swimming pool with separate kids pool. Lifeguard on duty during operating hours.",
                locationText: "Podium Level, Near Tower B",
                isVisibleInApp: true,
                displayOrder: 2,
                isBookable: false,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(6, 0),
                closeTime: new TimeOnly(21, 0),
                cleanupBufferMinutes: 0,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: null,
                maxGuests: null,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Fitness Center",
                code: "GYM1",
                type: AmenityType.GymRoom,
                description: "State-of-the-art fitness center with cardio equipment, free weights, and personal training area.",
                locationText: "Tower A, Level 1",
                isVisibleInApp: true,
                displayOrder: 3,
                isBookable: false,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(5, 0),
                closeTime: new TimeOnly(23, 0),
                cleanupBufferMinutes: 0,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: null,
                maxGuests: null,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Tennis Court 1",
                code: "TENNIS1",
                type: AmenityType.Court,
                description: "Professional tennis court with flood lights for evening play.",
                locationText: "Near Tower C",
                isVisibleInApp: true,
                displayOrder: 4,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(6, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 15,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: 3,
                maxGuests: 4,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Tennis Court 2",
                code: "TENNIS2",
                type: AmenityType.Court,
                description: "Professional tennis court with flood lights for evening play.",
                locationText: "Near Tower C",
                isVisibleInApp: true,
                displayOrder: 5,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(6, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 15,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: 3,
                maxGuests: 4,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "BBQ Area",
                code: "BBQ1",
                type: AmenityType.BBQArea,
                description: "Outdoor BBQ area with grills, seating, and covered pavilion.",
                locationText: "Garden Area, Near Pool",
                isVisibleInApp: true,
                displayOrder: 6,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 180,
                openTime: new TimeOnly(11, 0),
                closeTime: new TimeOnly(22, 0),
                cleanupBufferMinutes: 30,
                maxDaysInAdvance: 14,
                maxActiveBookingsPerUnit: 2,
                maxGuests: 20,
                depositRequired: true,
                depositAmount: 100,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Meeting Room - Boardroom",
                code: "MEET1",
                type: AmenityType.MeetingRoom,
                description: "Professional meeting room with video conferencing equipment and whiteboard.",
                locationText: "Tower A, Level 2",
                isVisibleInApp: true,
                displayOrder: 7,
                isBookable: true,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(8, 0),
                closeTime: new TimeOnly(20, 0),
                cleanupBufferMinutes: 15,
                maxDaysInAdvance: 14,
                maxActiveBookingsPerUnit: 5,
                maxGuests: 12,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId),

            Amenity.Create(
                name: "Children's Play Area",
                code: "PLAY1",
                type: AmenityType.Other,
                description: "Safe indoor play area for children with toys and soft play equipment.",
                locationText: "Tower B, Ground Floor",
                isVisibleInApp: true,
                displayOrder: 8,
                isBookable: false,
                requiresApproval: false,
                slotDurationMinutes: 60,
                openTime: new TimeOnly(9, 0),
                closeTime: new TimeOnly(19, 0),
                cleanupBufferMinutes: 0,
                maxDaysInAdvance: 7,
                maxActiveBookingsPerUnit: null,
                maxGuests: null,
                depositRequired: false,
                depositAmount: null,
                createdBy: _systemUserId)
        };

        _dbContext.Amenities.AddRange(amenities);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} amenities", amenities.Count);
        return amenities.Count;
    }
}
