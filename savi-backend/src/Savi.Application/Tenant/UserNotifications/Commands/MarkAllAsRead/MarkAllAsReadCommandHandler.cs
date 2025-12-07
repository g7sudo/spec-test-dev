using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.UserNotifications.Commands.MarkAllAsRead;

/// <summary>
/// Handler for MarkAllAsReadCommand.
/// </summary>
public sealed class MarkAllAsReadCommandHandler : IRequestHandler<MarkAllAsReadCommand, Result<int>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public MarkAllAsReadCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(
        MarkAllAsReadCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantUserId == null)
        {
            return Result.Failure<int>("User not found in community.");
        }

        var communityUserId = _currentUser.TenantUserId.Value;

        var unreadNotifications = await _dbContext.UserNotifications
            .Where(n => n.CommunityUserId == communityUserId
                && n.IsActive
                && !n.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadNotifications.Count == 0)
        {
            return Result.Success(0);
        }

        foreach (var notification in unreadNotifications)
        {
            notification.MarkAsRead();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(unreadNotifications.Count);
    }
}
