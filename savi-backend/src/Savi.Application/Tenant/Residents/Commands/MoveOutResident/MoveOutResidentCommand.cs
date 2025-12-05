using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Residents.Commands.MoveOutResident;

/// <summary>
/// Command to move out a resident from their lease.
/// Sets the MoveOutDate on the LeaseParty record.
/// </summary>
public record MoveOutResidentCommand(
    /// <summary>
    /// The LeaseParty ID of the resident to move out.
    /// </summary>
    Guid LeasePartyId,

    /// <summary>
    /// The move-out date.
    /// </summary>
    DateOnly MoveOutDate,

    /// <summary>
    /// For primary resident move-out: whether to end the entire lease.
    /// If false and they are primary, must specify NewPrimaryLeasePartyId.
    /// </summary>
    bool EndLease = false,

    /// <summary>
    /// When moving out the primary and not ending the lease,
    /// specify the LeaseParty ID that should become the new primary.
    /// </summary>
    Guid? NewPrimaryLeasePartyId = null,

    /// <summary>
    /// Optional termination reason if ending the lease.
    /// </summary>
    string? TerminationReason = null
) : IRequest<Result<bool>>;
