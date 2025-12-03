using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Ownership.Dtos;

/// <summary>
/// DTO for owner summary in the owners list view.
/// Aggregates ownership information per party.
/// </summary>
public record OwnerSummaryDto
{
    /// <summary>
    /// Party identifier.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Party display name.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// Type of party (Individual, Company, Entity).
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// Primary contact (email or phone) if available.
    /// </summary>
    public string? PrimaryContact { get; init; }

    /// <summary>
    /// Number of units currently owned (active ownership with no end date).
    /// </summary>
    public int ActiveOwnedUnitCount { get; init; }

    /// <summary>
    /// Total number of units ever owned (historical).
    /// </summary>
    public int TotalHistoricalUnitsCount { get; init; }

    /// <summary>
    /// Date of last ownership activity (most recent FromDate or ToDate).
    /// </summary>
    public DateTime? LastOwnershipActivityDate { get; init; }

    /// <summary>
    /// Whether this party has a linked community user account.
    /// </summary>
    public bool HasCommunityUserAccount { get; init; }
}
