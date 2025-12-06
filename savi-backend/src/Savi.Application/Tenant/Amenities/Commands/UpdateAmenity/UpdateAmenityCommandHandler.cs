using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateAmenity;

/// <summary>
/// Handler for updating an existing amenity.
/// </summary>
public class UpdateAmenityCommandHandler : IRequestHandler<UpdateAmenityCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public UpdateAmenityCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
    }

    public async Task<Result<bool>> Handle(
        UpdateAmenityCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Find the amenity
        var amenity = await _dbContext.Amenities
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.IsActive, cancellationToken);

        if (amenity == null)
        {
            return Result<bool>.Failure($"Amenity with ID '{request.Id}' not found.");
        }

        // Check for duplicate name (excluding current)
        var nameExists = await _dbContext.Amenities
            .AsNoTracking()
            .AnyAsync(a => a.Id != request.Id &&
                          a.Name.ToLower() == request.Name.ToLower() &&
                          a.IsActive, cancellationToken);

        if (nameExists)
        {
            return Result<bool>.Failure($"Another amenity with the name '{request.Name}' already exists.");
        }

        // Check for duplicate code if provided (excluding current)
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var codeExists = await _dbContext.Amenities
                .AsNoTracking()
                .AnyAsync(a => a.Id != request.Id &&
                              a.Code != null &&
                              a.Code.ToLower() == request.Code.ToLower() &&
                              a.IsActive, cancellationToken);

            if (codeExists)
            {
                return Result<bool>.Failure($"Another amenity with the code '{request.Code}' already exists.");
            }
        }

        // Simple path: no document changes
        var hasDocumentChanges = (request.Documents != null && request.Documents.Count > 0) ||
                                 (request.TempDocuments != null && request.TempDocuments.Count > 0);

        if (!hasDocumentChanges)
        {
            amenity.Update(
                request.Name,
                request.Code,
                request.Type,
                request.Description,
                request.LocationText,
                request.IsVisibleInApp,
                request.DisplayOrder,
                request.IsBookable,
                request.RequiresApproval,
                request.SlotDurationMinutes,
                request.OpenTime,
                request.CloseTime,
                request.CleanupBufferMinutes,
                request.MaxDaysInAdvance,
                request.MaxActiveBookingsPerUnit,
                request.MaxGuests,
                request.DepositRequired,
                request.DepositAmount,
                _currentUser.TenantUserId.Value);

            // Update status if different
            if (amenity.Status != request.Status)
            {
                amenity.UpdateStatus(request.Status, _currentUser.TenantUserId.Value);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }

        // Path with document management
        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
            return Result<bool>.Failure("Tenant context not available.");

        // Start transaction
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Update amenity basic properties
            amenity.Update(
                request.Name,
                request.Code,
                request.Type,
                request.Description,
                request.LocationText,
                request.IsVisibleInApp,
                request.DisplayOrder,
                request.IsBookable,
                request.RequiresApproval,
                request.SlotDurationMinutes,
                request.OpenTime,
                request.CloseTime,
                request.CleanupBufferMinutes,
                request.MaxDaysInAdvance,
                request.MaxActiveBookingsPerUnit,
                request.MaxGuests,
                request.DepositRequired,
                request.DepositAmount,
                _currentUser.TenantUserId.Value);

            // Update status if different
            if (amenity.Status != request.Status)
            {
                amenity.UpdateStatus(request.Status, _currentUser.TenantUserId.Value);
            }

            // Handle existing document updates/deletions
            if (request.Documents != null && request.Documents.Count > 0)
            {
                var documentIds = request.Documents.Select(d => d.Id).ToList();
                var existingDocuments = await _dbContext.Documents
                    .Where(d => documentIds.Contains(d.Id)
                        && d.OwnerId == request.Id
                        && d.OwnerType == DocumentOwnerType.Amenity
                        && d.IsActive)
                    .ToListAsync(cancellationToken);

                foreach (var docRequest in request.Documents)
                {
                    var document = existingDocuments.FirstOrDefault(d => d.Id == docRequest.Id);
                    if (document == null)
                        continue;

                    if (docRequest.ActionState == DocumentActionState.Deleted)
                    {
                        document.Deactivate(_currentUser.TenantUserId.Value);
                    }
                    else
                    {
                        document.UpdateMetadata(
                            docRequest.Title,
                            docRequest.Description,
                            docRequest.DisplayOrder ?? document.DisplayOrder,
                            _currentUser.TenantUserId.Value
                        );
                    }
                }
            }

            // Handle new temp documents
            if (request.TempDocuments != null && request.TempDocuments.Count > 0)
            {
                var tempFiles = await _dbContext.TempFileUploads
                    .Where(x => request.TempDocuments.Contains(x.TempKey) && x.IsActive)
                    .ToListAsync(cancellationToken);

                if (tempFiles.Count == 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result<bool>.Failure(
                        $"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
                }

                var filesNotOwnedByUser = tempFiles.Where(x => x.UploadedByUserId != _currentUser.TenantUserId.Value).ToList();
                if (filesNotOwnedByUser.Any())
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result<bool>.Failure("You can only attach files uploaded by yourself.");
                }

                var filesNotInTenant = tempFiles.Where(x => x.TenantId != tenantId.Value).ToList();
                if (filesNotInTenant.Any())
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result<bool>.Failure("Some files do not belong to the current tenant.");
                }

                var maxDisplayOrder = await _dbContext.Documents
                    .Where(d => d.OwnerId == request.Id
                        && d.OwnerType == DocumentOwnerType.Amenity
                        && d.IsActive)
                    .MaxAsync(d => (int?)d.DisplayOrder, cancellationToken) ?? 0;

                var displayOrder = maxDisplayOrder + 1;

                foreach (var tempFile in tempFiles)
                {
                    var destinationPath = $"tenant-{tenantId.Value}/amenities/{request.Id}/{tempFile.FileName}";

                    await _fileStorageService.MoveToPermanentAsync(
                        tempFile.BlobPath,
                        destinationPath,
                        cancellationToken);

                    var document = Document.Create(
                        ownerType: DocumentOwnerType.Amenity,
                        ownerId: request.Id,
                        category: DocumentCategory.Image,
                        fileName: tempFile.FileName,
                        blobPath: destinationPath,
                        contentType: tempFile.ContentType,
                        sizeBytes: tempFile.SizeBytes,
                        createdBy: _currentUser.TenantUserId.Value,
                        title: null,
                        description: null,
                        displayOrder: displayOrder++
                    );
                    _dbContext.Add(document);

                    tempFile.Deactivate(_currentUser.TenantUserId.Value);
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<bool>.Failure($"Failed to update amenity with document changes: {ex.Message}");
        }
    }
}
