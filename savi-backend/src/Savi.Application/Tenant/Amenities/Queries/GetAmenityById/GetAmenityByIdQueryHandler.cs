using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityById;

/// <summary>
/// Handler for GetAmenityByIdQuery.
/// </summary>
public class GetAmenityByIdQueryHandler
    : IRequestHandler<GetAmenityByIdQuery, Result<AmenityDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public GetAmenityByIdQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<AmenityDto>> Handle(
        GetAmenityByIdQuery request,
        CancellationToken cancellationToken)
    {
        var amenity = await _dbContext.Amenities
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.IsActive, cancellationToken);

        if (amenity == null)
        {
            return Result<AmenityDto>.Failure($"Amenity with ID '{request.Id}' not found.");
        }

        // Fetch documents for this amenity
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerId == request.Id
                && d.OwnerType == DocumentOwnerType.Amenity
                && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Build document DTOs with download URLs
        var documentDtos = new List<DocumentDto>();
        foreach (var doc in documents)
        {
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                doc.BlobPath,
                60,
                cancellationToken);

            documentDtos.Add(new DocumentDto
            {
                Id = doc.Id,
                FileName = doc.FileName,
                Title = doc.Title,
                Description = doc.Description,
                ContentType = doc.ContentType,
                SizeBytes = doc.SizeBytes,
                Category = doc.Category.ToString(),
                DisplayOrder = doc.DisplayOrder,
                ActionState = DocumentActionState.Active,
                DownloadUrl = downloadUrl,
                CreatedAt = doc.CreatedAt
            });
        }

        var dto = new AmenityDto
        {
            Id = amenity.Id,
            Name = amenity.Name,
            Code = amenity.Code,
            Type = amenity.Type,
            Status = amenity.Status,
            Description = amenity.Description,
            LocationText = amenity.LocationText,
            IsVisibleInApp = amenity.IsVisibleInApp,
            DisplayOrder = amenity.DisplayOrder,
            IsBookable = amenity.IsBookable,
            RequiresApproval = amenity.RequiresApproval,
            SlotDurationMinutes = amenity.SlotDurationMinutes,
            OpenTime = amenity.OpenTime,
            CloseTime = amenity.CloseTime,
            CleanupBufferMinutes = amenity.CleanupBufferMinutes,
            MaxDaysInAdvance = amenity.MaxDaysInAdvance,
            MaxActiveBookingsPerUnit = amenity.MaxActiveBookingsPerUnit,
            MaxGuests = amenity.MaxGuests,
            DepositRequired = amenity.DepositRequired,
            DepositAmount = amenity.DepositAmount,
            IsAvailableForBooking = amenity.IsAvailableForBooking,
            Documents = documentDtos,
            IsActive = amenity.IsActive,
            CreatedAt = amenity.CreatedAt
        };

        return Result<AmenityDto>.Success(dto);
    }
}
