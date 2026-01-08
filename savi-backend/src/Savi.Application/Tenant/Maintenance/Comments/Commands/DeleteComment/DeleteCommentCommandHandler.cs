using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.DeleteComment;

/// <summary>
/// Handler for deleting a comment and its associated attachments.
/// </summary>
public class DeleteCommentCommandHandler
    : IRequestHandler<DeleteCommentCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeleteCommentCommandHandler> _logger;

    public DeleteCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<DeleteCommentCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
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

        // Soft-delete all attachments (documents) associated with this comment
        var attachments = await _dbContext.Documents
            .Where(d => d.OwnerType == DocumentOwnerType.MaintenanceComment
                     && d.OwnerId == request.CommentId
                     && d.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var attachment in attachments)
        {
            attachment.Deactivate(_currentUser.TenantUserId);
            _logger.LogInformation(
                "Soft-deleted attachment {DocumentId} for comment {CommentId}",
                attachment.Id, request.CommentId);
        }

        // Soft-delete the comment
        comment.Deactivate(_currentUser.TenantUserId.Value);

        _logger.LogInformation(
            "Deleted comment {CommentId} with {AttachmentCount} attachments",
            request.CommentId, attachments.Count);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
