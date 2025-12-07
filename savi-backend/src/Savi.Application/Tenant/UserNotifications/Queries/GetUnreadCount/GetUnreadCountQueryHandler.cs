using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.UserNotifications.Queries.GetUnreadCount;

/// <summary>
/// Handler for GetUnreadCountQuery.
/// </summary>
public sealed class GetUnreadCountQueryHandler
    : IRequestHandler<GetUnreadCountQuery, Result<UnreadCountDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public GetUnreadCountQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<UnreadCountDto>> Handle(
        GetUnreadCountQuery request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantUserId == null)
        {
            return Result.Failure<UnreadCountDto>("User not found in community.");
        }

        var communityUserId = _currentUser.TenantUserId.Value;

        var unreadCount = await _dbContext.UserNotifications
            .Where(n => n.CommunityUserId == communityUserId
                && n.IsActive
                && !n.IsRead)
            .CountAsync(cancellationToken);

        return Result.Success(new UnreadCountDto { UnreadCount = unreadCount });
    }
}
