using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.PinAnnouncement;

/// <summary>
/// Handler for pinning/unpinning an announcement.
/// </summary>
public class PinAnnouncementCommandHandler : IRequestHandler<PinAnnouncementCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public PinAnnouncementCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        PinAnnouncementCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure("User does not exist in the current tenant.");
        }

        var userId = _currentUser.TenantUserId.Value;

        var announcement = await _dbContext.Announcements
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.IsActive, cancellationToken);

        if (announcement == null)
        {
            return Result.Failure("Announcement not found.");
        }

        try
        {
            if (request.IsPinned)
            {
                announcement.Pin(userId);
            }
            else
            {
                announcement.Unpin(userId);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to update pin status: {ex.Message}");
        }
    }
}
