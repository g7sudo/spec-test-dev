using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.DeleteComment;

/// <summary>
/// Handler for deleting a comment.
/// </summary>
public class DeleteCommentCommandHandler
    : IRequestHandler<DeleteCommentCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public DeleteCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        DeleteCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var comment = await _dbContext.MaintenanceComments
            .FirstOrDefaultAsync(c => c.Id == request.CommentId && c.IsActive, cancellationToken);

        if (comment == null)
        {
            return Result.Failure($"Comment with ID '{request.CommentId}' not found.");
        }

        comment.Deactivate(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
