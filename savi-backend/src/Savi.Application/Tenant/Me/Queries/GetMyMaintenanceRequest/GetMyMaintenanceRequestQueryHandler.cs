using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyMaintenanceRequest;

/// <summary>
/// Handler for getting a maintenance request by ID with permission-based access.
/// Respects CanViewAll → CanViewUnit → CanViewOwn hierarchy.
/// Includes attached files/images.
/// </summary>
public class GetMyMaintenanceRequestQueryHandler
    : IRequestHandler<GetMyMaintenanceRequestQuery, Result<MaintenanceRequestDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IResourceOwnershipChecker _ownershipChecker;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<GetMyMaintenanceRequestQueryHandler> _logger;

    public GetMyMaintenanceRequestQueryHandler(
        ITenantDbContext dbContext,
        IResourceOwnershipChecker ownershipChecker,
        IFileStorageService fileStorageService,
        ILogger<GetMyMaintenanceRequestQueryHandler> logger)
    {
        _dbContext = dbContext;
        _ownershipChecker = ownershipChecker;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<Result<MaintenanceRequestDto>> Handle(
        GetMyMaintenanceRequestQuery request,
        CancellationToken cancellationToken)
    {
        // Get user's access level
        var access = _ownershipChecker.GetMaintenanceRequestAccess();

        // User must have at least one view permission
        if (!access.CanViewAll && !access.CanViewUnit && !access.CanViewOwn)
        {
            return Result<MaintenanceRequestDto>.Failure(
                "User does not have permission to view maintenance requests.");
        }

        var maintenanceRequest = await (
            from r in _dbContext.MaintenanceRequests.Where(r => r.Id == request.RequestId && r.IsActive)
            join u in _dbContext.Units on r.UnitId equals u.Id into units
            from u in units.DefaultIfEmpty()
            join c in _dbContext.MaintenanceCategories on r.CategoryId equals c.Id into categories
            from c in categories.DefaultIfEmpty()
            join p in _dbContext.Parties on r.RequestedForPartyId equals p.Id into parties
            from p in parties.DefaultIfEmpty()
            join cu in _dbContext.CommunityUsers on r.RequestedByUserId equals cu.Id into users
            from cu in users.DefaultIfEmpty()
            join assignedUser in _dbContext.CommunityUsers on r.AssignedToUserId equals assignedUser.Id into assignedUsers
            from assignedUser in assignedUsers.DefaultIfEmpty()
            select new
            {
                Request = r,
                UnitNumber = u != null ? u.UnitNumber : null,
                CategoryName = c != null ? c.Name : null,
                RequestedForPartyName = p != null ? (p.PartyName ?? $"{p.FirstName} {p.LastName}".Trim()) : null,
                RequestedByUserName = cu != null ? cu.PreferredName : null,
                AssignedToUserName = assignedUser != null ? assignedUser.PreferredName : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result<MaintenanceRequestDto>.Failure(
                $"Maintenance request with ID '{request.RequestId}' not found.");
        }

        // Permission-based access validation
        if (!access.CanViewAll)
        {
            if (access.CanViewUnit)
            {
                // Check if request belongs to user's units
                var userUnitIds = await _ownershipChecker.GetUserUnitIdsAsync(cancellationToken);
                if (!userUnitIds.Contains(maintenanceRequest.Request.UnitId))
                {
                    // Fall back to own check
                    if (!access.CanViewOwn ||
                        !access.CurrentTenantUserId.HasValue ||
                        maintenanceRequest.Request.RequestedByUserId != access.CurrentTenantUserId.Value)
                    {
                        return Result<MaintenanceRequestDto>.Failure(
                            "You do not have permission to view this maintenance request.");
                    }
                }
            }
            else if (access.CanViewOwn)
            {
                // Only allow viewing own requests
                if (!access.CurrentTenantUserId.HasValue ||
                    maintenanceRequest.Request.RequestedByUserId != access.CurrentTenantUserId.Value)
                {
                    return Result<MaintenanceRequestDto>.Failure(
                        "You can only view maintenance requests that you created.");
                }
            }
        }

        // Fetch attachments (Documents linked to this MaintenanceRequest)
        var attachments = new List<MaintenanceRequestAttachmentDto>();
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerType == DocumentOwnerType.MaintenanceRequest
                     && d.OwnerId == request.RequestId
                     && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var doc in documents)
        {
            try
            {
                var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                    doc.BlobPath,
                    expiresInMinutes: 60,
                    cancellationToken);

                attachments.Add(new MaintenanceRequestAttachmentDto
                {
                    DocumentId = doc.Id,
                    FileName = doc.FileName,
                    ContentType = doc.ContentType,
                    SizeBytes = doc.SizeBytes,
                    Title = doc.Title,
                    DownloadUrl = downloadUrl,
                    DisplayOrder = doc.DisplayOrder,
                    CreatedAt = doc.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate download URL for document {DocumentId}", doc.Id);
                // Include attachment info without download URL
                attachments.Add(new MaintenanceRequestAttachmentDto
                {
                    DocumentId = doc.Id,
                    FileName = doc.FileName,
                    ContentType = doc.ContentType,
                    SizeBytes = doc.SizeBytes,
                    Title = doc.Title,
                    DownloadUrl = string.Empty,
                    DisplayOrder = doc.DisplayOrder,
                    CreatedAt = doc.CreatedAt
                });
            }
        }

        var dto = new MaintenanceRequestDto
        {
            Id = maintenanceRequest.Request.Id,
            TicketNumber = maintenanceRequest.Request.TicketNumber,
            UnitId = maintenanceRequest.Request.UnitId,
            UnitNumber = maintenanceRequest.UnitNumber,
            CategoryId = maintenanceRequest.Request.CategoryId,
            CategoryName = maintenanceRequest.CategoryName,
            RequestedForPartyId = maintenanceRequest.Request.RequestedForPartyId,
            RequestedForPartyName = maintenanceRequest.RequestedForPartyName,
            RequestedByUserId = maintenanceRequest.Request.RequestedByUserId,
            RequestedByUserName = maintenanceRequest.RequestedByUserName,
            AssignedToUserId = maintenanceRequest.Request.AssignedToUserId,
            AssignedToUserName = maintenanceRequest.AssignedToUserName,
            Title = maintenanceRequest.Request.Title,
            Description = maintenanceRequest.Request.Description,
            Status = maintenanceRequest.Request.Status,
            Priority = maintenanceRequest.Request.Priority,
            Source = maintenanceRequest.Request.Source,
            RequestedAt = maintenanceRequest.Request.RequestedAt,
            DueBy = maintenanceRequest.Request.DueBy,
            AssignedAt = maintenanceRequest.Request.AssignedAt,
            StartedAt = maintenanceRequest.Request.StartedAt,
            CompletedAt = maintenanceRequest.Request.CompletedAt,
            RejectedAt = maintenanceRequest.Request.RejectedAt,
            RejectionReason = maintenanceRequest.Request.RejectionReason,
            CancelledAt = maintenanceRequest.Request.CancelledAt,
            CancelledByUserId = maintenanceRequest.Request.CancelledByUserId,
            CancellationReason = maintenanceRequest.Request.CancellationReason,
            AssessmentSummary = maintenanceRequest.Request.AssessmentSummary,
            AssessmentCompletedAt = maintenanceRequest.Request.AssessmentCompletedAt,
            AssessmentByUserId = maintenanceRequest.Request.AssessmentByUserId,
            ResidentRating = maintenanceRequest.Request.ResidentRating,
            ResidentFeedback = maintenanceRequest.Request.ResidentFeedback,
            RatedAt = maintenanceRequest.Request.RatedAt,
            CreatedAt = maintenanceRequest.Request.CreatedAt,
            Attachments = attachments
        };

        return Result<MaintenanceRequestDto>.Success(dto);
    }
}
