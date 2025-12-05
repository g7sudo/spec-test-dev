using MediatR;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Queries.ListResidentInvitesByLease;

/// <summary>
/// Query to list resident invites for a lease.
/// </summary>
public record ListResidentInvitesByLeaseQuery(
    Guid LeaseId,
    ResidentInviteStatus? Status = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<ResidentInviteDto>>>;
