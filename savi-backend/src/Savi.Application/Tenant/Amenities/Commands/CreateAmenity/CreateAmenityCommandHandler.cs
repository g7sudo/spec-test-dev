using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenity;

/// <summary>
/// Handler for creating a new amenity.
/// </summary>
public class CreateAmenityCommandHandler : IRequestHandler<CreateAmenityCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public CreateAmenityCommandHandler(
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

    public async Task<Result<Guid>> Handle(
        CreateAmenityCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Check for duplicate name
        var nameExists = await _dbContext.Amenities
            .AsNoTracking()
            .AnyAsync(a => a.Name.ToLower() == request.Name.ToLower() && a.IsActive, cancellationToken);

        if (nameExists)
        {
            return Result<Guid>.Failure($"An amenity with the name '{request.Name}' already exists.");
        }

        // Check for duplicate code if provided
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var codeExists = await _dbContext.Amenities
                .AsNoTracking()
                .AnyAsync(a => a.Code != null && a.Code.ToLower() == request.Code.ToLower() && a.IsActive, cancellationToken);

            if (codeExists)
            {
                return Result<Guid>.Failure($"An amenity with the code '{request.Code}' already exists.");
            }
        }

        // If no documents, use simple path
        if (request.TempDocuments == null || request.TempDocuments.Count == 0)
        {
            var amenity = Amenity.Create(
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

            _dbContext.Add(amenity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(amenity.Id);
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
            return Result<Guid>.Failure(
                $"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
        }

        // Validate all files belong to current user
        var filesNotOwnedByUser = tempFiles.Where(x => x.UploadedByUserId != _currentUser.TenantUserId.Value).ToList();
        if (filesNotOwnedByUser.Any())
            return Result<Guid>.Failure("You can only attach files uploaded by yourself.");

        // Validate all files belong to current tenant
        var filesNotInTenant = tempFiles.Where(x => x.TenantId != tenantId.Value).ToList();
        if (filesNotInTenant.Any())
            return Result<Guid>.Failure("Some files do not belong to the current tenant.");

        // Start explicit transaction for amenity creation + file move
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create the amenity using domain factory method
            var amenity = Amenity.Create(
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

            _dbContext.Add(amenity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Move temp files to permanent storage and create documents
            var displayOrder = 1;
            foreach (var tempFile in tempFiles)
            {
                // Build destination path: tenant-{TenantId}/amenities/{AmenityId}/{FileName}
                var destinationPath = $"tenant-{tenantId.Value}/amenities/{amenity.Id}/{tempFile.FileName}";

                // Move file in blob storage
                await _fileStorageService.MoveToPermanentAsync(
                    tempFile.BlobPath,
                    destinationPath,
                    cancellationToken);

                // Create document entity
                var document = Document.Create(
                    ownerType: DocumentOwnerType.Amenity,
                    ownerId: amenity.Id,
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

            return Result<Guid>.Success(amenity.Id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<Guid>.Failure($"Failed to create amenity with images: {ex.Message}");
        }
    }
}
