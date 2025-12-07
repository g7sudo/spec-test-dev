using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.ArchiveAnnouncement;

/// <summary>
/// Handler for archiving an announcement.
/// </summary>
public class ArchiveAnnouncementCommandHandler : IRequestHandler<ArchiveAnnouncementCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public ArchiveAnnouncementCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        ArchiveAnnouncementCommand request,
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

        if (announcement.Status == AnnouncementStatus.Archived)
        {
            return Result.Failure("Announcement is already archived.");
        }

        try
        {
            announcement.Archive(userId);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to archive announcement: {ex.Message}");
        }
    }
}
