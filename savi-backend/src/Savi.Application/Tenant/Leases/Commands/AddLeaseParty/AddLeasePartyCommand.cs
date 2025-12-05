using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Commands.AddLeaseParty;

/// <summary>
/// Command to add a party to an existing lease.
/// </summary>
public record AddLeasePartyCommand(
    Guid LeaseId,
    Guid PartyId,
    LeasePartyRole Role,
    bool IsPrimary,
    DateOnly? MoveInDate
) : IRequest<Result<Guid>>;
