using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;
using Savi.MultiTenancy;
using UnitEntity = Savi.Domain.Tenant.Unit;

namespace Savi.Application.Tenant.Community.Commands.CreateUnit;
/// <summary>
/// Handler for creating a new unit.
/// </summary>
public class CreateUnitCommandHandler : IRequestHandler<CreateUnitCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public CreateUnitCommandHandler(
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
    public async Task<Result<Guid>> Handle(CreateUnitCommand request, CancellationToken cancellationToken)
    {
        // Verify block exists
        var blockExists = await _dbContext.Blocks
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.BlockId && x.IsActive, cancellationToken);
        if (!blockExists)
        {
            return Result<Guid>.Failure($"Block with ID '{request.BlockId}' not found.");
        }
        // Verify floor exists and belongs to the block
        var floorExists = await _dbContext.Floors
            .AnyAsync(x => x.Id == request.FloorId 
                && x.BlockId == request.BlockId 
                && x.IsActive, cancellationToken);
        if (!floorExists)
            return Result<Guid>.Failure($"Floor with ID '{request.FloorId}' not found or does not belong to the specified block.");
        // Verify unit type exists
        var unitTypeExists = await _dbContext.UnitTypes
            .AnyAsync(x => x.Id == request.UnitTypeId && x.IsActive, cancellationToken);
        if (!unitTypeExists)
            return Result<Guid>.Failure($"Unit type with ID '{request.UnitTypeId}' not found.");
        // Check if a unit with the same unit number already exists in this floor
        var unitNumberExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(x => x.FloorId == request.FloorId 
                && x.UnitNumber.ToLower() == request.UnitNumber.ToLower() 
                && x.IsActive, cancellationToken);

        if (unitNumberExists)
            return Result<Guid>.Failure($"A unit with the number '{request.UnitNumber}' already exists in this floor.");

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result<Guid>.Failure("User does not exist in the current tenant. Contact your administrator.");

        // If no documents, use simple path (backward compatible)
        if (request.TempDocuments == null || request.TempDocuments.Count == 0)
        {
            var unit = UnitEntity.Create(
                request.BlockId,
                request.FloorId,
                request.UnitTypeId,
                request.UnitNumber,
                request.AreaSqft,
                request.Status,
                request.Notes,
                _currentUser.TenantUserId.Value
            );
            _dbContext.Add(unit);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result<Guid>.Success(unit.Id);
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

        // Start explicit transaction for unit creation + file move
        await using var transaction = await ((DbContext)_dbContext).Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create the unit using domain factory method
            var unit = UnitEntity.Create(
                request.BlockId,
                request.FloorId,
                request.UnitTypeId,
                request.UnitNumber,
                request.AreaSqft,
                request.Status,
                request.Notes,
                _currentUser.TenantUserId.Value
            );
            _dbContext.Add(unit);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Move temp files to permanent storage and create documents
            var displayOrder = 1;
            foreach (var tempFile in tempFiles)
            {
                // Build destination path: tenant-{TenantId}/units/{UnitId}/{FileName}
                var destinationPath = $"tenant-{tenantId.Value}/units/{unit.Id}/{tempFile.FileName}";

                // Move file in blob storage
                await _fileStorageService.MoveToPermanentAsync(
                    tempFile.BlobPath,
                    destinationPath,
                    cancellationToken);

                // Create document entity
                var document = Document.Create(
                    ownerType: DocumentOwnerType.Unit,
                    ownerId: unit.Id,
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

            return Result<Guid>.Success(unit.Id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<Guid>.Failure($"Failed to create unit with images: {ex.Message}");
        }
    }
}
