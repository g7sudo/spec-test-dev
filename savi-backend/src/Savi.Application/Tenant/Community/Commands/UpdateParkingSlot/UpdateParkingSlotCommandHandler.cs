using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;
using Savi.MultiTenancy;

namespace Savi.Application.Tenant.Community.Commands.UpdateParkingSlot;
/// <summary>
/// Handler for updating an existing parking slot.
/// </summary>
public class UpdateParkingSlotCommandHandler : IRequestHandler<UpdateParkingSlotCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public UpdateParkingSlotCommandHandler(
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

    public async Task<Result> Handle(UpdateParkingSlotCommand request, CancellationToken cancellationToken)
    {
        // Find the parking slot
        var parkingSlot = await _dbContext.ParkingSlots
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (parkingSlot == null)
        {
            throw new NotFoundException("ParkingSlot", request.Id);
        }

        // Check if another parking slot with the same code exists (excluding current parking slot)
        var codeExists = await _dbContext.ParkingSlots
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id
                && x.Code.ToLower() == request.Code.ToLower()
                && x.IsActive, cancellationToken);
        if (codeExists)
            return Result.Failure($"A parking slot with the code '{request.Code}' already exists.");

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result.Failure("User does not exist in the current tenant. Contact your administrator.");

        // Simple path: no document changes
        var hasDocumentChanges = (request.Documents != null && request.Documents.Count > 0) ||
                                 (request.TempDocuments != null && request.TempDocuments.Count > 0);

        if (!hasDocumentChanges)
        {
            parkingSlot.Update(
                request.Code,
                request.LocationType,
                request.LevelLabel,
                request.IsCovered,
                request.IsEVCompatible,
                request.Notes,
                _currentUser.TenantUserId.Value
            );
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }

        // Path with document management
        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
            return Result.Failure("Tenant context not available.");

        // Start transaction for parking slot update + document management
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Update parking slot basic properties
            parkingSlot.Update(
                request.Code,
                request.LocationType,
                request.LevelLabel,
                request.IsCovered,
                request.IsEVCompatible,
                request.Notes,
                _currentUser.TenantUserId.Value
            );

            // Handle existing document updates/deletions
            if (request.Documents != null && request.Documents.Count > 0)
            {
                var documentIds = request.Documents.Select(d => d.Id).ToList();
                var existingDocuments = await _dbContext.Documents
                    .Where(d => documentIds.Contains(d.Id)
                        && d.OwnerId == request.Id
                        && d.OwnerType == DocumentOwnerType.ParkingSlot
                        && d.IsActive)
                    .ToListAsync(cancellationToken);

                foreach (var docRequest in request.Documents)
                {
                    var document = existingDocuments.FirstOrDefault(d => d.Id == docRequest.Id);
                    if (document == null)
                        continue; // Skip if document not found or doesn't belong to this parking slot

                    if (docRequest.ActionState == DocumentActionState.Deleted)
                    {
                        // Soft-delete the document
                        document.Deactivate(_currentUser.TenantUserId.Value);
                    }
                    else
                    {
                        // Update document metadata
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
                // Fetch temp files
                var tempFiles = await _dbContext.TempFileUploads
                    .Where(x => request.TempDocuments.Contains(x.TempKey) && x.IsActive)
                    .ToListAsync(cancellationToken);

                if (tempFiles.Count == 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result.Failure($"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
                }

                // Validate ownership
                var filesNotOwnedByUser = tempFiles.Where(x => x.UploadedByUserId != _currentUser.TenantUserId.Value).ToList();
                if (filesNotOwnedByUser.Any())
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result.Failure("You can only attach files uploaded by yourself.");
                }

                var filesNotInTenant = tempFiles.Where(x => x.TenantId != tenantId.Value).ToList();
                if (filesNotInTenant.Any())
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result.Failure("Some files do not belong to the current tenant.");
                }

                // Get max display order for existing documents
                var maxDisplayOrder = await _dbContext.Documents
                    .Where(d => d.OwnerId == request.Id
                        && d.OwnerType == DocumentOwnerType.ParkingSlot
                        && d.IsActive)
                    .MaxAsync(d => (int?)d.DisplayOrder, cancellationToken) ?? 0;

                var displayOrder = maxDisplayOrder + 1;

                foreach (var tempFile in tempFiles)
                {
                    // Build destination path
                    var destinationPath = $"tenant-{tenantId.Value}/parkingslots/{request.Id}/{tempFile.FileName}";

                    // Move file
                    await _fileStorageService.MoveToPermanentAsync(
                        tempFile.BlobPath,
                        destinationPath,
                        cancellationToken);

                    // Create document
                    var document = Document.Create(
                        ownerType: DocumentOwnerType.ParkingSlot,
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

                    // Soft-delete temp file
                    tempFile.Deactivate(_currentUser.TenantUserId.Value);
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result.Success();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure($"Failed to update parking slot with document changes: {ex.Message}");
        }
    }
}
