using MediatR;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformUsers;

/// <summary>
/// Query to list platform users with their role assignments.
/// </summary>
public record ListPlatformUsersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null
) : IRequest<Result<PagedResult<PlatformUserRbacDto>>>;
