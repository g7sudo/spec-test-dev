using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformRoleUsers;

/// <summary>
/// Handler for listing users assigned to a platform role.
/// </summary>
public class ListPlatformRoleUsersQueryHandler
    : IRequestHandler<ListPlatformRoleUsersQuery, Result<List<RoleUserDto>>>
{
    private readonly IPlatformDbContext _dbContext;

    public ListPlatformRoleUsersQueryHandler(IPlatformDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<RoleUserDto>>> Handle(
        ListPlatformRoleUsersQuery request,
        CancellationToken cancellationToken)
    {
        // Verify role exists
        var roleExists = await _dbContext.PlatformRoles
            .AsNoTracking()
            .AnyAsync(r => r.Id == request.RoleId, cancellationToken);

        if (!roleExists)
        {
            return Result<List<RoleUserDto>>.Failure($"Role with ID '{request.RoleId}' not found.");
        }

        var users = await _dbContext.PlatformUserRoles
            .AsNoTracking()
            .Where(ur => ur.PlatformRoleId == request.RoleId)
            .Join(
                _dbContext.PlatformUsers,
                ur => ur.PlatformUserId,
                u => u.Id,
                (ur, u) => u)
            .OrderBy(u => u.FullName)
            .Select(u => new RoleUserDto(
                u.Id,
                u.Email,
                u.FullName ?? string.Empty,
                u.PhoneNumber,
                u.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result<List<RoleUserDto>>.Success(users);
    }
}
