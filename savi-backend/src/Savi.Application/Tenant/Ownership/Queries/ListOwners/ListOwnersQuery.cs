using MediatR;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Queries.ListOwners;

/// <summary>
/// Query to list all owners (parties with ownership records).
/// Returns aggregated view of ownership per party.
/// </summary>
public record ListOwnersQuery(
    string? SearchTerm = null,
    PartyType? PartyType = null,
    bool CurrentOwnersOnly = false,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<OwnerSummaryDto>>>;
