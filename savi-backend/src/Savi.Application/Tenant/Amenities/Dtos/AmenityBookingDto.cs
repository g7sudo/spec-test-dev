using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Amenities.Dtos;

/// <summary>
/// DTO for amenity booking details.
/// </summary>
public record AmenityBookingDto
{
    public Guid Id { get; init; }
    public Guid AmenityId { get; init; }
    public string AmenityName { get; init; } = string.Empty;
    public Guid UnitId { get; init; }
    public string UnitNumber { get; init; } = string.Empty;
    public string? BlockName { get; init; }
    public Guid BookedForUserId { get; init; }
    public string BookedForUserName { get; init; } = string.Empty;

    public DateTime StartAt { get; init; }
    public DateTime EndAt { get; init; }
    public AmenityBookingStatus Status { get; init; }
    public AmenityBookingSource Source { get; init; }

    public string? Title { get; init; }
    public string? Notes { get; init; }
    public string? AdminNotes { get; init; }
    public int? NumberOfGuests { get; init; }

    // Approval tracking
    public DateTime? ApprovedAt { get; init; }
    public Guid? ApprovedByUserId { get; init; }
    public string? ApprovedByUserName { get; init; }

    public DateTime? RejectedAt { get; init; }
    public Guid? RejectedByUserId { get; init; }
    public string? RejectedByUserName { get; init; }
    public string? RejectionReason { get; init; }

    public DateTime? CancelledAt { get; init; }
    public Guid? CancelledByUserId { get; init; }
    public string? CancelledByUserName { get; init; }
    public string? CancellationReason { get; init; }

    public DateTime? CompletedAt { get; init; }

    // Deposit tracking
    public bool DepositRequired { get; init; }
    public decimal? DepositAmount { get; init; }
    public AmenityDepositStatus DepositStatus { get; init; }
    public string? DepositReference { get; init; }

    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Summary DTO for booking list views.
/// </summary>
public record AmenityBookingSummaryDto
{
    public Guid Id { get; init; }
    public Guid AmenityId { get; init; }
    public string AmenityName { get; init; } = string.Empty;
    public string UnitNumber { get; init; } = string.Empty;
    public string BookedForUserName { get; init; } = string.Empty;
    public DateTime StartAt { get; init; }
    public DateTime EndAt { get; init; }
    public AmenityBookingStatus Status { get; init; }
    public AmenityBookingSource Source { get; init; }
    public string? Title { get; init; }
    public int? NumberOfGuests { get; init; }
    public AmenityDepositStatus DepositStatus { get; init; }
}
