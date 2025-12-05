using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListRoleGroupUsers;

/// <summary>
/// Handler for listing users assigned to a role group.
/// </summary>
public class ListRoleGroupUsersQueryHandler
    : IRequestHandler<ListRoleGroupUsersQuery, Result<List<RoleGroupUserDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListRoleGroupUsersQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<RoleGroupUserDto>>> Handle(
        ListRoleGroupUsersQuery request,
        CancellationToken cancellationToken)
    {
        // Verify role group exists
        var roleGroupExists = await _dbContext.RoleGroups
            .AsNoTracking()
            .AnyAsync(rg => rg.Id == request.RoleGroupId && rg.IsActive, cancellationToken);

        if (!roleGroupExists)
        {
            return Result<List<RoleGroupUserDto>>.Failure($"Role group with ID '{request.RoleGroupId}' not found.");
        }

        var users = await _dbContext.CommunityUserRoleGroups
            .AsNoTracking()
            .Where(curg => curg.RoleGroupId == request.RoleGroupId)
            .Join(
                _dbContext.CommunityUsers,
                curg => curg.CommunityUserId,
                cu => cu.Id,
                (curg, cu) => new { curg, cu })
            .GroupJoin(
                _dbContext.Parties,
                x => x.cu.PartyId,
                p => p.Id,
                (x, parties) => new { x.curg, x.cu, Party = parties.FirstOrDefault() })
            .OrderBy(x => x.Party != null ? x.Party.PartyName : x.cu.PreferredName)
            .Select(x => new RoleGroupUserDto(
                x.cu.Id,
                x.cu.PreferredName,
                x.cu.PartyId,
                x.Party != null ? x.Party.PartyName : null,
                x.curg.IsPrimary,
                x.curg.ValidFrom,
                x.curg.ValidTo,
                x.cu.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result<List<RoleGroupUserDto>>.Success(users);
    }
}
