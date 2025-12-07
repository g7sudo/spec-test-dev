using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.AddAnnouncementComment;

/// <summary>
/// Handler for adding a comment to an announcement.
/// </summary>
public class AddAnnouncementCommentCommandHandler : IRequestHandler<AddAnnouncementCommentCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AddAnnouncementCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        AddAnnouncementCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure("User does not exist in the current tenant.");
        }

        var userId = _currentUser.TenantUserId.Value;

        // Verify announcement exists and allows comments
        var announcement = await _dbContext.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AnnouncementId &&
                                      a.IsActive &&
                                      a.Status == AnnouncementStatus.Published,
                cancellationToken);

        if (announcement == null)
        {
            return Result<Guid>.Failure("Announcement not found.");
        }

        if (!announcement.AllowComments)
        {
            return Result<Guid>.Failure("Comments are not enabled for this announcement.");
        }

        // Validate parent comment if provided
        if (request.ParentCommentId.HasValue)
        {
            var parentExists = await _dbContext.AnnouncementComments
                .AsNoTracking()
                .AnyAsync(c => c.Id == request.ParentCommentId.Value &&
                              c.AnnouncementId == request.AnnouncementId &&
                              c.IsActive,
                    cancellationToken);

            if (!parentExists)
            {
                return Result<Guid>.Failure("Parent comment not found.");
            }
        }

        try
        {
            var comment = AnnouncementComment.Create(
                request.AnnouncementId,
                userId,
                request.Content,
                request.ParentCommentId);

            _dbContext.Add(comment);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(comment.Id);
        }
        catch (Exception ex)
        {
            return Result<Guid>.Failure($"Failed to add comment: {ex.Message}");
        }
    }
}
