using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Commands.CreateLease;

/// <summary>
/// Command to create a new lease for a unit.
/// Creates lease in Draft status.
/// </summary>
public record CreateLeaseCommand(
    Guid UnitId,
    DateOnly StartDate,
    DateOnly? EndDate,
    decimal? MonthlyRent,
    decimal? DepositAmount,
    string? Notes,
    List<CreateLeasePartyInput>? Parties
) : IRequest<Result<Guid>>;

/// <summary>
/// Input for a party to be added to the lease.
/// </summary>
public record CreateLeasePartyInput(
    Guid PartyId,
    LeasePartyRole Role,
    bool IsPrimary,
    DateOnly? MoveInDate
);
