using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.CreateMaintenanceRequest;

/// <summary>
/// Handler for creating a maintenance request from the mobile app.
/// Auto-populates UnitId and PartyId from the user's active lease.
/// </summary>
public class CreateMyMaintenanceRequestCommandHandler
    : IRequestHandler<CreateMyMaintenanceRequestCommand, Result<CreateMyMaintenanceRequestResultDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<CreateMyMaintenanceRequestCommandHandler> _logger;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

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

    public CreateMyMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<CreateMyMaintenanceRequestCommandHandler> logger,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
    }

    public async Task<Result<CreateMyMaintenanceRequestResultDto>> Handle(
        CreateMyMaintenanceRequestCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant context
        var tenantUserId = _currentUser.TenantUserId;
        if (!tenantUserId.HasValue)
        {
            return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                "User does not exist in the current tenant.");
        }

        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
        {
            return Result<CreateMyMaintenanceRequestResultDto>.Failure("Tenant context not available.");
        }

        // Validate title
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Result<CreateMyMaintenanceRequestResultDto>.Failure("Title is required.");
        }

        // Validate attachments count
        if (request.Attachments.Count > MaxAttachments)
        {
            return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                $"Maximum {MaxAttachments} attachments allowed.");
        }

        // Validate attachment content types and sizes
        foreach (var attachment in request.Attachments)
        {
            if (!AllowedContentTypes.Contains(attachment.ContentType))
            {
                return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                    $"Invalid file type '{attachment.ContentType}'. Allowed: JPEG, PNG, GIF, WebP, HEIC.");
            }

            var fileSize = attachment.FileSize > 0 ? attachment.FileSize : attachment.FileStream.Length;
            if (fileSize > MaxFileSizeBytes)
            {
                return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                    $"File '{attachment.FileName}' exceeds maximum size of 10MB.");
            }
        }

        // Get user's active lease to find UnitId and PartyId
        var leaseInfo = await GetUserLeaseInfoAsync(tenantUserId.Value, cancellationToken);
        if (leaseInfo == null)
        {
            return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                "No active lease found. You must have an active lease to create a maintenance request.");
        }

        // Validate category code and get category ID
        var category = await _dbContext.MaintenanceCategories
            .AsNoTracking()
            .Where(c => c.Code == request.CategoryCode && c.IsActive)
            .Select(c => new { c.Id })
            .FirstOrDefaultAsync(cancellationToken);

        if (category == null)
        {
            return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                $"Category with code '{request.CategoryCode}' not found.");
        }

        var categoryId = category.Id;

        // Generate ticket number
        var ticketNumber = await GenerateTicketNumberAsync(cancellationToken);

        // Start transaction
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create the maintenance request
            var maintenanceRequest = MaintenanceRequest.Create(
                ticketNumber: ticketNumber,
                unitId: leaseInfo.UnitId,
                categoryId: categoryId,
                requestedForPartyId: leaseInfo.PartyId,
                requestedByUserId: tenantUserId.Value,
                title: request.Title,
                description: request.Description,
                priority: request.Priority,
                source: MaintenanceSource.MobileApp,
                dueBy: null,
                createdBy: tenantUserId.Value);

            _dbContext.Add(maintenanceRequest);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Created maintenance request {TicketNumber} for user {UserId}, unit {UnitId}",
                ticketNumber, tenantUserId.Value, leaseInfo.UnitId);

            // Upload attachments
            var attachmentResults = new List<MaintenanceAttachmentResultDto>();
            int displayOrder = 0;

            foreach (var attachment in request.Attachments)
            {
                try
                {
                    var attachmentResult = await UploadAttachmentAsync(
                        tenantId.Value,
                        maintenanceRequest.Id,
                        attachment,
                        tenantUserId.Value,
                        displayOrder++,
                        cancellationToken);

                    attachmentResults.Add(attachmentResult);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to upload attachment {FileName}", attachment.FileName);
                    // Continue with other attachments - don't fail the whole request
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result<CreateMyMaintenanceRequestResultDto>.Success(new CreateMyMaintenanceRequestResultDto
            {
                RequestId = maintenanceRequest.Id,
                TicketNumber = ticketNumber,
                UnitNumber = leaseInfo.UnitNumber,
                Attachments = attachmentResults
            });
        }
        catch (Exception ex)
        {
            try
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            catch (Exception rollbackEx)
            {
                _logger.LogWarning(rollbackEx, "Error during transaction rollback");
            }

            _logger.LogError(ex, "Failed to create maintenance request for user {UserId}", tenantUserId.Value);
            return Result<CreateMyMaintenanceRequestResultDto>.Failure(
                $"Failed to create maintenance request: {ex.Message}");
        }
    }

    private async Task<UserLeaseInfo?> GetUserLeaseInfoAsync(Guid communityUserId, CancellationToken cancellationToken)
    {
        // Step 1: Get CommunityUser's PartyId (same approach as /me/home)
        var communityUser = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(cu => cu.Id == communityUserId && cu.IsActive)
            .Select(cu => new { cu.PartyId })
            .FirstOrDefaultAsync(cancellationToken);

        if (communityUser?.PartyId == null)
        {
            _logger.LogWarning("CommunityUser {CommunityUserId} not found or has no PartyId", communityUserId);
            return null;
        }

        // Step 2: Find active lease party by PartyId (NOT CommunityUserId)
        var leaseInfo = await (
            from lp in _dbContext.LeaseParties.Where(lp => lp.IsActive && lp.PartyId == communityUser.PartyId)
            join l in _dbContext.Leases.Where(l => l.IsActive && l.Status == LeaseStatus.Active)
                on lp.LeaseId equals l.Id
            join u in _dbContext.Units.Where(u => u.IsActive)
                on l.UnitId equals u.Id
            where !lp.MoveOutDate.HasValue // Not moved out
            select new UserLeaseInfo
            {
                UnitId = l.UnitId,
                UnitNumber = u.UnitNumber,
                PartyId = lp.PartyId
            })
            .FirstOrDefaultAsync(cancellationToken);

        return leaseInfo;
    }

    private async Task<string> GenerateTicketNumberAsync(CancellationToken cancellationToken)
    {
        var latestRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (latestRequest != null && !string.IsNullOrEmpty(latestRequest.TicketNumber))
        {
            var parts = latestRequest.TicketNumber.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[1], out var currentNumber))
            {
                nextNumber = currentNumber + 1;
            }
        }

        return $"MT-{nextNumber:D6}";
    }

    private async Task<MaintenanceAttachmentResultDto> UploadAttachmentAsync(
        Guid tenantId,
        Guid maintenanceRequestId,
        MaintenanceAttachment attachment,
        Guid createdBy,
        int displayOrder,
        CancellationToken cancellationToken)
    {
        // Determine file extension
        var extension = ContentTypeExtensions.GetValueOrDefault(attachment.ContentType, ".jpg");
        var fileName = !string.IsNullOrWhiteSpace(attachment.FileName)
            ? attachment.FileName
            : $"maintenance-{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";

        if (!Path.HasExtension(fileName))
        {
            fileName += extension;
        }

        var fileSize = attachment.FileSize > 0 ? attachment.FileSize : attachment.FileStream.Length;

        // Upload to blob storage
        var blobPath = await _fileStorageService.UploadPermanentFileAsync(
            tenantId,
            "MaintenanceRequest",
            maintenanceRequestId,
            fileName,
            attachment.FileStream,
            attachment.ContentType,
            cancellationToken);

        _logger.LogInformation("Uploaded attachment to blob path: {BlobPath}", blobPath);

        // Create document entity
        var document = Document.Create(
            ownerType: DocumentOwnerType.MaintenanceRequest,
            ownerId: maintenanceRequestId,
            category: DocumentCategory.Image,
            fileName: fileName,
            blobPath: blobPath,
            contentType: attachment.ContentType,
            sizeBytes: fileSize,
            createdBy: createdBy,
            title: "Maintenance Photo",
            description: null,
            displayOrder: displayOrder);

        _dbContext.Add(document);

        // Generate download URL
        var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
            blobPath,
            expiresInMinutes: 60,
            cancellationToken);

        return new MaintenanceAttachmentResultDto
        {
            DocumentId = document.Id,
            FileName = fileName,
            DownloadUrl = downloadUrl
        };
    }

    private record UserLeaseInfo
    {
        public Guid UnitId { get; init; }
        public string UnitNumber { get; init; } = string.Empty;
        public Guid PartyId { get; init; }
    }
}
