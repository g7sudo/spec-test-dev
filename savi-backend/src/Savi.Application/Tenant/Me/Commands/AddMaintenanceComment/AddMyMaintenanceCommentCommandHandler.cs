using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.AddMaintenanceComment;

/// <summary>
/// Handler for adding a comment to the current user's own maintenance request.
/// Auto-sets CommentType to ResidentComment and visibility to resident/owner.
/// Supports optional image attachments.
/// </summary>
public class AddMyMaintenanceCommentCommandHandler
    : IRequestHandler<AddMyMaintenanceCommentCommand, Result<AddMyCommentResultDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AddMyMaintenanceCommentCommandHandler> _logger;

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

    public AddMyMaintenanceCommentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext,
        ILogger<AddMyMaintenanceCommentCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<Result<AddMyCommentResultDto>> Handle(
        AddMyMaintenanceCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<AddMyCommentResultDto>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
        {
            return Result<AddMyCommentResultDto>.Failure("Tenant context not available.");
        }

        // Validate maintenance request exists and get ownership info
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result<AddMyCommentResultDto>.Failure(
                $"Maintenance request with ID '{request.RequestId}' not found.");
        }

        // Ownership validation: Only allow comments on requests user created
        if (maintenanceRequest.RequestedByUserId != _currentUser.TenantUserId.Value)
        {
            return Result<AddMyCommentResultDto>.Failure(
                "You can only add comments to maintenance requests that you created.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return Result<AddMyCommentResultDto>.Failure("Message is required.");
        }

        // Validate attachments
        if (request.Attachments.Count > MaxAttachments)
        {
            return Result<AddMyCommentResultDto>.Failure(
                $"Maximum {MaxAttachments} attachments allowed per comment.");
        }

        foreach (var attachment in request.Attachments)
        {
            if (!AllowedContentTypes.Contains(attachment.ContentType))
            {
                return Result<AddMyCommentResultDto>.Failure(
                    $"Invalid file type '{attachment.ContentType}'. Allowed: JPEG, PNG, GIF, WebP, HEIC.");
            }

            var fileSize = attachment.FileSize > 0 ? attachment.FileSize : attachment.FileStream.Length;
            if (fileSize > MaxFileSizeBytes)
            {
                return Result<AddMyCommentResultDto>.Failure(
                    $"File '{attachment.FileName}' exceeds maximum size of 10MB.");
            }
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

        _logger.LogInformation(
            "Created resident comment {CommentId} for maintenance request {RequestId}",
            comment.Id, request.RequestId);

        // Upload attachments
        var attachmentResults = new List<MyCommentAttachmentResultDto>();
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

        return Result<AddMyCommentResultDto>.Success(new AddMyCommentResultDto
        {
            CommentId = comment.Id,
            Attachments = attachmentResults
        });
    }

    private async Task<MyCommentAttachmentResultDto> UploadAttachmentAsync(
        Guid tenantId,
        Guid commentId,
        MyCommentAttachment attachment,
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

        return new MyCommentAttachmentResultDto
        {
            DocumentId = document.Id,
            FileName = fileName,
            DownloadUrl = downloadUrl
        };
    }
}
