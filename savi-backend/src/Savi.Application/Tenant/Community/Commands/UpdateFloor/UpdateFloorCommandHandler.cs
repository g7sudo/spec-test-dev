using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;

namespace Savi.Application.Tenant.Community.Commands.UpdateFloor;
/// <summary>
/// Handler for updating an existing floor.
/// </summary>
public class UpdateFloorCommandHandler : IRequestHandler<UpdateFloorCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public UpdateFloorCommandHandler(
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
    public async Task<Result> Handle(UpdateFloorCommand request, CancellationToken cancellationToken)
    {
        // Find the floor
        var floor = await _dbContext.Floors
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (floor == null)
        {
            throw new NotFoundException("Floor", request.Id);
        }

        // Check if another floor with the same name exists in the same block (excluding current floor)
        var nameExists = await _dbContext.Floors
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id
                && x.BlockId == floor.BlockId
                && x.Name.ToLower() == request.Name.ToLower()
                && x.IsActive, cancellationToken);
        if (nameExists)
        {
            return Result.Failure($"A floor with the name '{request.Name}' already exists in this block.");
        }

        // Check if another floor with the same level number exists in the same block (excluding current floor)
        var levelExists = await _dbContext.Floors
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id
                && x.BlockId == floor.BlockId
                && x.LevelNumber == request.LevelNumber
                && x.IsActive, cancellationToken);

        if (levelExists)
        {
            return Result.Failure($"A floor with level number '{request.LevelNumber}' already exists in this block.");
        }

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result.Failure("User does not exist in the current tenant. Contact your administrator.");

        // Simple path: no document changes
        var hasDocumentChanges = (request.Documents != null && request.Documents.Count > 0) ||
                                 (request.TempDocuments != null && request.TempDocuments.Count > 0);

        if (!hasDocumentChanges)
        {
            floor.Update(
                request.Name,
                request.LevelNumber,
                request.DisplayOrder,
                _currentUser.TenantUserId.Value
            );
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }

        // Path with document management
        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
            return Result.Failure("Tenant context not available.");

        // Start transaction
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Update floor basic properties
            floor.Update(
                request.Name,
                request.LevelNumber,
                request.DisplayOrder,
                _currentUser.TenantUserId.Value
            );

            // Handle existing document updates/deletions
            if (request.Documents != null && request.Documents.Count > 0)
            {
                var documentIds = request.Documents.Select(d => d.Id).ToList();
                var existingDocuments = await _dbContext.Documents
                    .Where(d => documentIds.Contains(d.Id)
                        && d.OwnerId == request.Id
                        && d.OwnerType == DocumentOwnerType.Floor
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
                    return Result.Failure($"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
                }

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

                var maxDisplayOrder = await _dbContext.Documents
                    .Where(d => d.OwnerId == request.Id
                        && d.OwnerType == DocumentOwnerType.Floor
                        && d.IsActive)
                    .MaxAsync(d => (int?)d.DisplayOrder, cancellationToken) ?? 0;

                var displayOrder = maxDisplayOrder + 1;

                foreach (var tempFile in tempFiles)
                {
                    var destinationPath = $"tenant-{tenantId.Value}/floors/{request.Id}/{tempFile.FileName}";

                    await _fileStorageService.MoveToPermanentAsync(
                        tempFile.BlobPath,
                        destinationPath,
                        cancellationToken);

                    var document = Document.Create(
                        ownerType: DocumentOwnerType.Floor,
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

            return Result.Success();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure($"Failed to update floor with document changes: {ex.Message}");
        }
    }
}
