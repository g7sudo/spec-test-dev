using MediatR;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Profile;

/// <summary>
/// Handler for GetMyPlatformProfileQuery.
/// Loads the current user's profile and tenant memberships from PlatformDB.
/// </summary>
public sealed class GetMyPlatformProfileQueryHandler
    : IRequestHandler<GetMyPlatformProfileQuery, Result<MyPlatformProfileDto>>
{
    private readonly ICurrentUser _currentUser;
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ILogger<GetMyPlatformProfileQueryHandler> _logger;

    public GetMyPlatformProfileQueryHandler(
        ICurrentUser currentUser,
        IPlatformDbContext platformDbContext,
        ILogger<GetMyPlatformProfileQueryHandler> logger)
    {
        _currentUser = currentUser;
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    public async Task<Result<MyPlatformProfileDto>> Handle(
        GetMyPlatformProfileQuery request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting platform profile for user {UserId}", _currentUser.UserId);

        // Get user details
        var users = _platformDbContext.PlatformUsers
            .Where(u => u.Id == _currentUser.UserId && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.PhoneNumber
            })
            .Take(1)
            .ToList();

        var user = users.FirstOrDefault();

        if (user == null)
        {
            _logger.LogWarning("PlatformUser not found for UserId {UserId}", _currentUser.UserId);
            return Result.Failure<MyPlatformProfileDto>("User not found.");
        }

        // Get platform roles from database (explicit query for accuracy)
        var platformRoles = _platformDbContext.PlatformUserRoles
            .Where(ur => ur.PlatformUserId == _currentUser.UserId && ur.IsActive)
            .Join(
                _platformDbContext.PlatformRoles.Where(r => r.IsActive),
                ur => ur.PlatformRoleId,
                r => r.Id,
                (ur, r) => r.Code)
            .ToList();

        // Get tenant memberships
        var memberships = _platformDbContext.UserTenantMemberships
            .Where(m => m.PlatformUserId == _currentUser.UserId && m.IsActive)
            .Join(
                _platformDbContext.Tenants.Where(t => t.IsActive),
                m => m.TenantId,
                t => t.Id,
                (m, t) => new TenantMembershipDto
                {
                    TenantId = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    Status = m.Status.ToString(),
                    RoleCode = m.TenantRoleCode
                })
            .ToList();

        var profile = new MyPlatformProfileDto
        {
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            PlatformRoles = platformRoles,
            Tenants = memberships
        };

        _logger.LogInformation(
            "Retrieved profile for user {UserId} with {TenantCount} tenants",
            user.Id,
            memberships.Count);

        return Result.Success(profile);
    }
}

