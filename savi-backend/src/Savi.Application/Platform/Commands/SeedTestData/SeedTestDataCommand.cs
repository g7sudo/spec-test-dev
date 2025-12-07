using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Commands.SeedTestData;

/// <summary>
/// Command to seed test/demo data for a specific tenant.
/// Used for development and demonstration purposes.
/// </summary>
public record SeedTestDataCommand(Guid TenantId) : IRequest<Result<SeedTestDataResponse>>;

/// <summary>
/// Response from seeding test data.
/// </summary>
public class SeedTestDataResponse
{
    public Guid TenantId { get; set; }
    public string TenantCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public SeedTestDataStats Stats { get; set; } = new();
}

/// <summary>
/// Statistics about the seeded data.
/// </summary>
public class SeedTestDataStats
{
    public int BlocksCreated { get; set; }
    public int FloorsCreated { get; set; }
    public int UnitsCreated { get; set; }
    public int ParkingSlotsCreated { get; set; }
    public int PartiesCreated { get; set; }
    public int OwnershipsCreated { get; set; }
    public int LeasesCreated { get; set; }
    public int AmenitiesCreated { get; set; }
}
