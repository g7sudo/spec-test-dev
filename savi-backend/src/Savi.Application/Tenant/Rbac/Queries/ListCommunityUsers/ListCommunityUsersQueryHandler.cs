using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListCommunityUsers;

/// <summary>
/// Handler for listing community users with their role groups.
/// </summary>
public class ListCommunityUsersQueryHandler
    : IRequestHandler<ListCommunityUsersQuery, Result<PagedResult<CommunityUserRbacDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListCommunityUsersQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<CommunityUserRbacDto>>> Handle(
        ListCommunityUsersQuery request,
        CancellationToken cancellationToken)
    {
        // Build base query with party join
        var baseQuery = from cu in _dbContext.CommunityUsers.AsNoTracking()
                        join p in _dbContext.Parties.AsNoTracking() on cu.PartyId equals p.Id into parties
                        from party in parties.DefaultIfEmpty()
                        where cu.IsActive
                        select new { cu, party };

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.ToLower();
            baseQuery = baseQuery.Where(x =>
                (x.cu.PreferredName != null && x.cu.PreferredName.ToLower().Contains(searchTerm)) ||
                (x.party != null && x.party.PartyName.ToLower().Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await baseQuery.CountAsync(cancellationToken);

        // Get paged users
        var users = await baseQuery
            .OrderBy(x => x.party != null ? x.party.PartyName : x.cu.PreferredName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Get user IDs for role lookup
        var userIds = users.Select(x => x.cu.Id).ToList();

        // Get role assignments for these users
        var userRoles = await _dbContext.CommunityUserRoleGroups
            .AsNoTracking()
            .Where(curg => userIds.Contains(curg.CommunityUserId))
            .Join(
                _dbContext.RoleGroups,
                curg => curg.RoleGroupId,
                rg => rg.Id,
                (curg, rg) => new
                {
                    curg.CommunityUserId,
                    rg.Id,
                    rg.Code,
                    rg.Name,
                    curg.IsPrimary,
                    curg.ValidFrom,
                    curg.ValidTo
                })
            .ToListAsync(cancellationToken);

        // Map to DTOs
        var userDtos = users.Select(x => new CommunityUserRbacDto(
            x.cu.Id,
            x.cu.PartyId,
            x.party?.PartyName,
            x.cu.PreferredName,
            x.cu.PlatformUserId,
            x.cu.CreatedAt,
            userRoles
                .Where(ur => ur.CommunityUserId == x.cu.Id)
                .Select(ur => new UserRoleGroupAssignmentDto(
                    ur.Id,
                    ur.Code,
                    ur.Name,
                    ur.IsPrimary,
                    ur.ValidFrom,
                    ur.ValidTo))
                .ToList()
        )).ToList();

        var result = new PagedResult<CommunityUserRbacDto>(
            userDtos,
            totalCount,
            request.Page,
            request.PageSize
        );

        return Result<PagedResult<CommunityUserRbacDto>>.Success(result);
    }
}
