using MediatR;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListCommunityUsers;

/// <summary>
/// Query to list community users with their role group assignments.
/// </summary>
public record ListCommunityUsersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null
) : IRequest<Result<PagedResult<CommunityUserRbacDto>>>;
