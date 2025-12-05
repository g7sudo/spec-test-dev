using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformUsers;

/// <summary>
/// Handler for listing platform users with their roles.
/// </summary>
public class ListPlatformUsersQueryHandler
    : IRequestHandler<ListPlatformUsersQuery, Result<PagedResult<PlatformUserRbacDto>>>
{
    private readonly IPlatformDbContext _dbContext;

    public ListPlatformUsersQueryHandler(IPlatformDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<PlatformUserRbacDto>>> Handle(
        ListPlatformUsersQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.PlatformUsers.AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(searchTerm) ||
                u.FullName.ToLower().Contains(searchTerm));
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paged users
        var users = await query
            .OrderBy(u => u.FullName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Get user IDs for role lookup
        var userIds = users.Select(u => u.Id).ToList();

        // Get role assignments for these users
        var userRoles = await _dbContext.PlatformUserRoles
            .AsNoTracking()
            .Where(ur => userIds.Contains(ur.PlatformUserId))
            .Join(
                _dbContext.PlatformRoles,
                ur => ur.PlatformRoleId,
                r => r.Id,
                (ur, r) => new { ur.PlatformUserId, r.Id, r.Code, r.Name })
            .ToListAsync(cancellationToken);

        // Map to DTOs
        var userDtos = users.Select(u => new PlatformUserRbacDto(
            u.Id,
            u.Email,
            u.FullName,
            u.PhoneNumber,
            u.CreatedAt,
            userRoles
                .Where(ur => ur.PlatformUserId == u.Id)
                .Select(ur => new UserRoleAssignmentDto(ur.Id, ur.Code, ur.Name))
                .ToList()
        )).ToList();

        var result = new PagedResult<PlatformUserRbacDto>(
            userDtos,
            totalCount,
            request.Page,
            request.PageSize
        );

        return Result<PagedResult<PlatformUserRbacDto>>.Success(result);
    }
}
