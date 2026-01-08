using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Comments.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyMaintenanceComments;

/// <summary>
/// Handler for getting comments for a maintenance request with permission-based access.
/// Respects CanViewAll → CanViewUnit → CanViewOwn hierarchy.
/// For non-admin users, only returns resident-visible comments.
/// Returns comments with their associated attachments.
/// </summary>
public class GetMyMaintenanceCommentsQueryHandler
    : IRequestHandler<GetMyMaintenanceCommentsQuery, Result<List<MaintenanceCommentDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IResourceOwnershipChecker _ownershipChecker;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<GetMyMaintenanceCommentsQueryHandler> _logger;

    public GetMyMaintenanceCommentsQueryHandler(
        ITenantDbContext dbContext,
        IResourceOwnershipChecker ownershipChecker,
        IFileStorageService fileStorageService,
        ILogger<GetMyMaintenanceCommentsQueryHandler> logger)
    {
        _dbContext = dbContext;
        _ownershipChecker = ownershipChecker;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<Result<List<MaintenanceCommentDto>>> Handle(
        GetMyMaintenanceCommentsQuery request,
        CancellationToken cancellationToken)
    {
        // Get user's access level
        var access = _ownershipChecker.GetMaintenanceRequestAccess();

        // User must have at least one view permission
        if (!access.CanViewAll && !access.CanViewUnit && !access.CanViewOwn)
        {
            return Result<List<MaintenanceCommentDto>>.Failure(
                "User does not have permission to view maintenance requests.");
        }

        // Validate maintenance request exists
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result<List<MaintenanceCommentDto>>.Failure(
                $"Maintenance request with ID '{request.RequestId}' not found.");
        }

        // Permission-based access validation
        bool isAdmin = access.CanViewAll;

        if (!access.CanViewAll)
        {
            if (access.CanViewUnit)
            {
                // Check if request belongs to user's units
                var userUnitIds = await _ownershipChecker.GetUserUnitIdsAsync(cancellationToken);
                if (!userUnitIds.Contains(maintenanceRequest.UnitId))
                {
                    // Fall back to own check
                    if (!access.CanViewOwn ||
                        !access.CurrentTenantUserId.HasValue ||
                        maintenanceRequest.RequestedByUserId != access.CurrentTenantUserId.Value)
                    {
                        return Result<List<MaintenanceCommentDto>>.Failure(
                            "You do not have permission to view comments for this maintenance request.");
                    }
                }
            }
            else if (access.CanViewOwn)
            {
                // Only allow viewing comments for own requests
                if (!access.CurrentTenantUserId.HasValue ||
                    maintenanceRequest.RequestedByUserId != access.CurrentTenantUserId.Value)
                {
                    return Result<List<MaintenanceCommentDto>>.Failure(
                        "You can only view comments for maintenance requests that you created.");
                }
            }
        }

        // Build query - filter comments based on visibility for non-admin users
        var query = _dbContext.MaintenanceComments
            .AsNoTracking()
            .Where(c => c.MaintenanceRequestId == request.RequestId && c.IsActive);

        // Non-admin users only see resident-visible comments
        if (!isAdmin)
        {
            query = query.Where(c => c.IsVisibleToResident);
        }

        // Get comments with creator info
        var comments = await (
            from c in query
            join cu in _dbContext.CommunityUsers on c.CreatedBy equals cu.Id into users
            from cu in users.DefaultIfEmpty()
            orderby c.CreatedAt
            select new
            {
                c.Id,
                c.MaintenanceRequestId,
                c.CommentType,
                c.Message,
                c.IsVisibleToResident,
                c.IsVisibleToOwner,
                CreatedById = c.CreatedBy ?? Guid.Empty,
                CreatedByName = cu != null ? cu.PreferredName : null,
                c.CreatedAt,
                c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        if (!comments.Any())
        {
            return Result<List<MaintenanceCommentDto>>.Success(new List<MaintenanceCommentDto>());
        }

        // Fetch all attachments for these comments
        var commentIds = comments.Select(c => c.Id).ToList();
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerType == DocumentOwnerType.MaintenanceComment
                     && commentIds.Contains(d.OwnerId)
                     && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        // Group documents by comment ID and generate download URLs
        var attachmentsByComment = new Dictionary<Guid, List<CommentAttachmentDto>>();

        foreach (var doc in documents)
        {
            if (!attachmentsByComment.ContainsKey(doc.OwnerId))
            {
                attachmentsByComment[doc.OwnerId] = new List<CommentAttachmentDto>();
            }

            string downloadUrl = string.Empty;
            try
            {
                downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                    doc.BlobPath,
                    expiresInMinutes: 60,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate download URL for document {DocumentId}", doc.Id);
            }

            attachmentsByComment[doc.OwnerId].Add(new CommentAttachmentDto
            {
                DocumentId = doc.Id,
                FileName = doc.FileName,
                ContentType = doc.ContentType,
                SizeBytes = doc.SizeBytes,
                DownloadUrl = downloadUrl,
                CreatedAt = doc.CreatedAt
            });
        }

        // Map to DTOs with attachments
        var result = comments.Select(c => new MaintenanceCommentDto
        {
            Id = c.Id,
            MaintenanceRequestId = c.MaintenanceRequestId,
            CommentType = c.CommentType,
            Message = c.Message,
            IsVisibleToResident = c.IsVisibleToResident,
            IsVisibleToOwner = c.IsVisibleToOwner,
            CreatedById = c.CreatedById,
            CreatedByName = c.CreatedByName,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            Attachments = attachmentsByComment.GetValueOrDefault(c.Id, new List<CommentAttachmentDto>())
        }).ToList();

        return Result<List<MaintenanceCommentDto>>.Success(result);
    }
}
