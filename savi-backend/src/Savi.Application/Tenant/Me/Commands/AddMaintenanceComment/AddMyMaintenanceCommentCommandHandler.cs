using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.AddMaintenanceComment;

/// <summary>
/// Handler for adding a comment to the current user's own maintenance request.
/// Auto-sets CommentType to ResidentUpdate and visibility to resident/owner.
/// </summary>
public class AddMyMaintenanceCommentCommandHandler
    : IRequestHandler<AddMyMaintenanceCommentCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AddMyMaintenanceCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        AddMyMaintenanceCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate maintenance request exists and get ownership info
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result<Guid>.Failure($"Maintenance request with ID '{request.RequestId}' not found.");
        }

        // Ownership validation: Only allow comments on requests user created
        if (maintenanceRequest.RequestedByUserId != _currentUser.TenantUserId.Value)
        {
            return Result<Guid>.Failure("You can only add comments to maintenance requests that you created.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return Result<Guid>.Failure("Message is required.");
        }

        // Auto-set: CommentType=ResidentComment, IsVisibleToResident=true, IsVisibleToOwner=true
        var comment = MaintenanceComment.Create(
            request.RequestId,
            MaintenanceCommentType.ResidentComment,
            request.Message,
            isVisibleToResident: true,
            isVisibleToOwner: true,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(comment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(comment.Id);
    }
}
