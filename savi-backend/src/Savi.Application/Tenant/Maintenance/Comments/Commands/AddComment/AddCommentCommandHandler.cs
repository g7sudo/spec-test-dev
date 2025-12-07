using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.AddComment;

/// <summary>
/// Handler for adding a comment to a maintenance request.
/// </summary>
public class AddCommentCommandHandler
    : IRequestHandler<AddCommentCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AddCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        AddCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate maintenance request exists
        var requestExists = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(r => r.Id == request.MaintenanceRequestId && r.IsActive, cancellationToken);

        if (!requestExists)
        {
            return Result<Guid>.Failure($"Maintenance request with ID '{request.MaintenanceRequestId}' not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return Result<Guid>.Failure("Message is required.");
        }

        var comment = MaintenanceComment.Create(
            request.MaintenanceRequestId,
            request.CommentType,
            request.Message,
            request.IsVisibleToResident,
            request.IsVisibleToOwner,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(comment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(comment.Id);
    }
}
