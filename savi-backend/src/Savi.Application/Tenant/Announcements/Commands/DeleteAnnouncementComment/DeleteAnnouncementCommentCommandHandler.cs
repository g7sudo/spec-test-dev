using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.DeleteAnnouncementComment;

/// <summary>
/// Handler for deleting a comment.
/// </summary>
public class DeleteAnnouncementCommentCommandHandler : IRequestHandler<DeleteAnnouncementCommentCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public DeleteAnnouncementCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        DeleteAnnouncementCommentCommand request,
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

        // Users can only delete their own comments
        // Admin permission check should be done at controller level
        if (comment.CommunityUserId != userId)
        {
            return Result.Failure("You can only delete your own comments.");
        }

        try
        {
            comment.Deactivate(userId);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to delete comment: {ex.Message}");
        }
    }
}
