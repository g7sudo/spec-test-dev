using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.UserNotifications.Commands.MarkAsRead;

/// <summary>
/// Handler for MarkAsReadCommand.
/// </summary>
public sealed class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public MarkAsReadCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        MarkAsReadCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantUserId == null)
        {
            return Result.Failure("User not found in community.");
        }

        var communityUserId = _currentUser.TenantUserId.Value;

        var notification = await _dbContext.UserNotifications
            .Where(n => n.Id == request.NotificationId
                && n.CommunityUserId == communityUserId
                && n.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (notification == null)
        {
            return Result.Failure("Notification not found.");
        }

        notification.MarkAsRead();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
