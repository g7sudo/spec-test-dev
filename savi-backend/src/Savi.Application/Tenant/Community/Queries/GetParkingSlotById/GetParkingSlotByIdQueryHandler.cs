using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Application.Tenant.Files.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Queries.GetParkingSlotById;
/// <summary>
/// Handler for getting a parking slot by ID.
/// </summary>
public class GetParkingSlotByIdQueryHandler : IRequestHandler<GetParkingSlotByIdQuery, Result<ParkingSlotDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public GetParkingSlotByIdQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<ParkingSlotDto>> Handle(GetParkingSlotByIdQuery request, CancellationToken cancellationToken)
    {
        var parkingSlot = await _dbContext.ParkingSlots
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new ParkingSlotDto
            {
                Id = x.Id,
                Code = x.Code,
                LocationType = x.LocationType.ToString(),
                LevelLabel = x.LevelLabel,
                IsCovered = x.IsCovered,
                IsEVCompatible = x.IsEVCompatible,
                Status = x.Status.ToString(),
                Notes = x.Notes,
                AllocatedUnitId = x.AllocatedUnitId,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (parkingSlot == null)
        {
            throw new NotFoundException("ParkingSlot", request.Id);
        }

        // Get unit number if allocated
        if (parkingSlot.AllocatedUnitId.HasValue)
        {
            var unitNumber = await _dbContext.Units
                .AsNoTracking()
                .Where(u => u.Id == parkingSlot.AllocatedUnitId.Value)
                .Select(u => u.UnitNumber)
                .FirstOrDefaultAsync(cancellationToken);

            parkingSlot = parkingSlot with { AllocatedUnitNumber = unitNumber };
        }

        // Get documents (images) for this parking slot
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerType == DocumentOwnerType.ParkingSlot
                     && d.OwnerId == parkingSlot.Id
                     && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Generate download URLs for each document
        var documentDtos = new List<DocumentDto>();
        foreach (var doc in documents)
        {
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                doc.BlobPath,
                60, // 60 minutes expiry
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

        parkingSlot = parkingSlot with { Documents = documentDtos };

        return Result<ParkingSlotDto>.Success(parkingSlot);
    }
}
