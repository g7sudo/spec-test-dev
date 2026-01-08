using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Comments.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Comments.Queries.ListComments;

/// <summary>
/// Handler for ListCommentsQuery.
/// Returns comments with their associated attachments.
/// </summary>
public class ListCommentsQueryHandler
    : IRequestHandler<ListCommentsQuery, Result<List<MaintenanceCommentDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<ListCommentsQueryHandler> _logger;

    public ListCommentsQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService,
        ILogger<ListCommentsQueryHandler> logger)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
        _logger = logger;
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
                (c, cu) => new
                {
                    c.Id,
                    c.MaintenanceRequestId,
                    c.CommentType,
                    c.Message,
                    c.IsVisibleToResident,
                    c.IsVisibleToOwner,
                    CreatedById = c.CreatedBy ?? Guid.Empty,
                    CreatedByName = cu.PreferredName,
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
