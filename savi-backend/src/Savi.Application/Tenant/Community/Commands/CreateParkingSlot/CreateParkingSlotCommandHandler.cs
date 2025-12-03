using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;
using Savi.MultiTenancy;

namespace Savi.Application.Tenant.Community.Commands.CreateParkingSlot;
/// <summary>
/// Handler for creating a new parking slot.
/// </summary>
public class CreateParkingSlotCommandHandler : IRequestHandler<CreateParkingSlotCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public CreateParkingSlotCommandHandler(
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

    public async Task<Result<Guid>> Handle(CreateParkingSlotCommand request, CancellationToken cancellationToken)
    {
        // Check if a parking slot with the same code already exists
        var codeExists = await _dbContext.ParkingSlots
            .AsNoTracking()
            .AnyAsync(x => x.Code.ToLower() == request.Code.ToLower() && x.IsActive, cancellationToken);
        if (codeExists)
        {
            return Result<Guid>.Failure($"A parking slot with the code '{request.Code}' already exists.");
        }

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result<Guid>.Failure("User does not exist in the current tenant. Contact your administrator.");

        // If no documents, use simple path (backward compatible)
        if (request.TempDocuments == null || request.TempDocuments.Count == 0)
        {
            var parkingSlot = ParkingSlot.Create(
                request.Code,
                request.LocationType,
                request.LevelLabel,
                request.IsCovered,
                request.IsEVCompatible,
                request.Status,
                request.Notes,
                _currentUser.TenantUserId.Value
            );
            _dbContext.Add(parkingSlot);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result<Guid>.Success(parkingSlot.Id);
        }

        // Path with documents - validate tenant context
        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
            return Result<Guid>.Failure("Tenant context not available.");

        // Fetch ALL temp file uploads matching the provided tempKeys
        var tempFiles = await _dbContext.TempFileUploads
            .Where(x => request.TempDocuments.Contains(x.TempKey) && x.IsActive)
            .ToListAsync(cancellationToken);

        // Validate at least one file found
        if (tempFiles.Count == 0)
        {
            return Result<Guid>.Failure($"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
        }

        // Validate all files belong to current user
        var filesNotOwnedByUser = tempFiles.Where(x => x.UploadedByUserId != _currentUser.TenantUserId.Value).ToList();
        if (filesNotOwnedByUser.Any())
            return Result<Guid>.Failure("You can only attach files uploaded by yourself.");

        // Validate all files belong to current tenant
        var filesNotInTenant = tempFiles.Where(x => x.TenantId != tenantId.Value).ToList();
        if (filesNotInTenant.Any())
            return Result<Guid>.Failure("Some files do not belong to the current tenant.");

        // Start explicit transaction for parking slot creation + file move
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create the parking slot using domain factory method
            var parkingSlot = ParkingSlot.Create(
                request.Code,
                request.LocationType,
                request.LevelLabel,
                request.IsCovered,
                request.IsEVCompatible,
                request.Status,
                request.Notes,
                _currentUser.TenantUserId.Value
            );
            _dbContext.Add(parkingSlot);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Move temp files to permanent storage and create documents
            var displayOrder = 1;
            foreach (var tempFile in tempFiles)
            {
                // Build destination path: tenant-{TenantId}/parkingslots/{ParkingSlotId}/{FileName}
                var destinationPath = $"tenant-{tenantId.Value}/parkingslots/{parkingSlot.Id}/{tempFile.FileName}";

                // Move file in blob storage
                await _fileStorageService.MoveToPermanentAsync(
                    tempFile.BlobPath,
                    destinationPath,
                    cancellationToken);

                // Create document entity
                var document = Document.Create(
                    ownerType: DocumentOwnerType.ParkingSlot,
                    ownerId: parkingSlot.Id,
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

                // Soft-delete temp file record
                tempFile.Deactivate(_currentUser.TenantUserId.Value);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result<Guid>.Success(parkingSlot.Id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<Guid>.Failure($"Failed to create parking slot with images: {ex.Message}");
        }
    }
}
