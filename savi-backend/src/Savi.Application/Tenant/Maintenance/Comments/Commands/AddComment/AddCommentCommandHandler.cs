using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.AddComment;

/// <summary>
/// Handler for adding a comment to a maintenance request with optional attachments.
/// </summary>
public class AddCommentCommandHandler
    : IRequestHandler<AddCommentCommand, Result<AddCommentResultDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AddCommentCommandHandler> _logger;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
        "image/heif"
    };

    private static readonly Dictionary<string, string> ContentTypeExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { "image/jpeg", ".jpg" },
        { "image/jpg", ".jpg" },
        { "image/png", ".png" },
        { "image/gif", ".gif" },
        { "image/webp", ".webp" },
        { "image/heic", ".heic" },
        { "image/heif", ".heif" }
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB per file
    private const int MaxAttachments = 5;

    public AddCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext,
        ILogger<AddCommentCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<Result<AddCommentResultDto>> Handle(
        AddCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<AddCommentResultDto>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
        {
            return Result<AddCommentResultDto>.Failure("Tenant context not available.");
        }

        // Validate maintenance request exists
        var requestExists = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(r => r.Id == request.MaintenanceRequestId && r.IsActive, cancellationToken);

        if (!requestExists)
        {
            return Result<AddCommentResultDto>.Failure(
                $"Maintenance request with ID '{request.MaintenanceRequestId}' not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return Result<AddCommentResultDto>.Failure("Message is required.");
        }

        // Validate attachments
        if (request.Attachments.Count > MaxAttachments)
        {
            return Result<AddCommentResultDto>.Failure(
                $"Maximum {MaxAttachments} attachments allowed per comment.");
        }

        foreach (var attachment in request.Attachments)
        {
            if (!AllowedContentTypes.Contains(attachment.ContentType))
            {
                return Result<AddCommentResultDto>.Failure(
                    $"Invalid file type '{attachment.ContentType}'. Allowed: JPEG, PNG, GIF, WebP, HEIC.");
            }

            var fileSize = attachment.FileSize > 0 ? attachment.FileSize : attachment.FileStream.Length;
            if (fileSize > MaxFileSizeBytes)
            {
                return Result<AddCommentResultDto>.Failure(
                    $"File '{attachment.FileName}' exceeds maximum size of 10MB.");
            }
        }

        // Create comment
        var comment = MaintenanceComment.Create(
            request.MaintenanceRequestId,
            request.CommentType,
            request.Message,
            request.IsVisibleToResident,
            request.IsVisibleToOwner,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(comment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created comment {CommentId} for maintenance request {RequestId}",
            comment.Id, request.MaintenanceRequestId);

        // Upload attachments
        var attachmentResults = new List<CommentAttachmentResultDto>();
        int displayOrder = 0;

        foreach (var attachment in request.Attachments)
        {
            try
            {
                var attachmentResult = await UploadAttachmentAsync(
                    tenantId.Value,
                    comment.Id,
                    attachment,
                    _currentUser.TenantUserId.Value,
                    displayOrder++,
                    cancellationToken);

                attachmentResults.Add(attachmentResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload attachment {FileName} for comment {CommentId}",
                    attachment.FileName, comment.Id);
                // Continue with other attachments
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<AddCommentResultDto>.Success(new AddCommentResultDto
        {
            CommentId = comment.Id,
            Attachments = attachmentResults
        });
    }

    private async Task<CommentAttachmentResultDto> UploadAttachmentAsync(
        Guid tenantId,
        Guid commentId,
        CommentAttachment attachment,
        Guid createdBy,
        int displayOrder,
        CancellationToken cancellationToken)
    {
        var extension = ContentTypeExtensions.GetValueOrDefault(attachment.ContentType, ".jpg");
        var fileName = !string.IsNullOrWhiteSpace(attachment.FileName)
            ? attachment.FileName
            : $"comment-{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";

        if (!Path.HasExtension(fileName))
        {
            fileName += extension;
        }

        var fileSize = attachment.FileSize > 0 ? attachment.FileSize : attachment.FileStream.Length;

        // Upload to blob storage
        var blobPath = await _fileStorageService.UploadPermanentFileAsync(
            tenantId,
            "MaintenanceComment",
            commentId,
            fileName,
            attachment.FileStream,
            attachment.ContentType,
            cancellationToken);

        _logger.LogInformation("Uploaded comment attachment to blob path: {BlobPath}", blobPath);

        // Create document entity with OwnerType = MaintenanceComment
        var document = Document.Create(
            ownerType: DocumentOwnerType.MaintenanceComment,
            ownerId: commentId,
            category: DocumentCategory.Image,
            fileName: fileName,
            blobPath: blobPath,
            contentType: attachment.ContentType,
            sizeBytes: fileSize,
            createdBy: createdBy,
            title: "Comment Photo",
            description: null,
            displayOrder: displayOrder);

        _dbContext.Add(document);

        // Generate download URL
        var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
            blobPath,
            expiresInMinutes: 60,
            cancellationToken);

        return new CommentAttachmentResultDto
        {
            DocumentId = document.Id,
            FileName = fileName,
            DownloadUrl = downloadUrl
        };
    }
}
