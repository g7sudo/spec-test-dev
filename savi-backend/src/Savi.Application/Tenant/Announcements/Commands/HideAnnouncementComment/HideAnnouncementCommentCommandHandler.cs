using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.HideAnnouncementComment;

/// <summary>
/// Handler for hiding/unhiding a comment (moderation).
/// </summary>
public class HideAnnouncementCommentCommandHandler : IRequestHandler<HideAnnouncementCommentCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public HideAnnouncementCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        HideAnnouncementCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure("User does not exist in the current tenant.");
        }

        var userId = _currentUser.TenantUserId.Value;

        var comment = await _dbContext.AnnouncementComments
            .FirstOrDefaultAsync(c => c.Id == request.CommentId && c.IsActive, cancellationToken);

        if (comment == null)
        {
            return Result.Failure("Comment not found.");
        }

        try
        {
            if (request.Hide)
            {
                comment.Hide(userId);
            }
            else
            {
                comment.Show(userId);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to update comment visibility: {ex.Message}");
        }
    }
}
