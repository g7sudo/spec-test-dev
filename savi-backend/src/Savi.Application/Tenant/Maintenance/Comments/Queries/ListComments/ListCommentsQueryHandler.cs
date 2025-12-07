using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Comments.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Comments.Queries.ListComments;

/// <summary>
/// Handler for ListCommentsQuery.
/// </summary>
public class ListCommentsQueryHandler
    : IRequestHandler<ListCommentsQuery, Result<List<MaintenanceCommentDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListCommentsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<MaintenanceCommentDto>>> Handle(
        ListCommentsQuery request,
        CancellationToken cancellationToken)
    {
        // Validate maintenance request exists
        var requestExists = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(r => r.Id == request.MaintenanceRequestId && r.IsActive, cancellationToken);

        if (!requestExists)
        {
            return Result<List<MaintenanceCommentDto>>.Failure(
                $"Maintenance request with ID '{request.MaintenanceRequestId}' not found.");
        }

        var query = _dbContext.MaintenanceComments
            .AsNoTracking()
            .Where(c => c.MaintenanceRequestId == request.MaintenanceRequestId && c.IsActive);

        // Optionally filter out internal comments
        if (!request.IncludeInternal)
        {
            query = query.Where(c => c.CommentType != MaintenanceCommentType.StaffInternalNote);
        }

        var comments = await query
            .OrderBy(c => c.CreatedAt)
            .Join(
                _dbContext.CommunityUsers,
                c => c.CreatedBy,
                cu => cu.Id,
                (c, cu) => new MaintenanceCommentDto
                {
                    Id = c.Id,
                    MaintenanceRequestId = c.MaintenanceRequestId,
                    CommentType = c.CommentType,
                    Message = c.Message,
                    IsVisibleToResident = c.IsVisibleToResident,
                    IsVisibleToOwner = c.IsVisibleToOwner,
                    CreatedById = c.CreatedBy ?? Guid.Empty,
                    CreatedByName = cu.PreferredName,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
            .ToListAsync(cancellationToken);

        return Result<List<MaintenanceCommentDto>>.Success(comments);
    }
}
