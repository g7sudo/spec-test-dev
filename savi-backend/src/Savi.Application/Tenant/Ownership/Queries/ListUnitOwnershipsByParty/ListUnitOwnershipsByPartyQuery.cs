using MediatR;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Queries.ListUnitOwnershipsByParty;

/// <summary>
/// Query to list all ownerships for a specific party (owner).
/// Used in Owner Detail page to show all units owned by this party.
/// </summary>
public record ListUnitOwnershipsByPartyQuery(
    Guid PartyId,
    bool CurrentOnly = false,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<UnitOwnershipDto>>>;
