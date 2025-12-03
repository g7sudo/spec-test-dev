using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListParkingSlots;
/// <summary>
/// Handler for listing parking slots with pagination and optional filtering.
/// </summary>
public class ListParkingSlotsQueryHandler : IRequestHandler<ListParkingSlotsQuery, Result<PagedResult<ParkingSlotDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public ListParkingSlotsQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<PagedResult<ParkingSlotDto>>> Handle(ListParkingSlotsQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.ParkingSlots
            .AsNoTracking()
            .Where(x => x.IsActive);

        // Apply filters
        if (request.AllocatedUnitId.HasValue)
        {
            query = query.Where(x => x.AllocatedUnitId == request.AllocatedUnitId.Value);
        }
        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.Code)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
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
            .ToListAsync(cancellationToken);

        // Get unit numbers for allocated slots
        var allocatedUnitIds = items
            .Where(x => x.AllocatedUnitId.HasValue)
            .Select(x => x.AllocatedUnitId!.Value)
            .Distinct()
            .ToList();

        Dictionary<Guid, string> unitNumbers = new();
        if (allocatedUnitIds.Any())
        {
            unitNumbers = await _dbContext.Units
                .AsNoTracking()
                .Where(u => allocatedUnitIds.Contains(u.Id))
                .Select(u => new { u.Id, u.UnitNumber })
                .ToDictionaryAsync(u => u.Id, u => u.UnitNumber, cancellationToken);
        }

        // Fetch documents for all parking slots in this page
        var parkingSlotIds = items.Select(x => x.Id).ToList();
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => parkingSlotIds.Contains(d.OwnerId)
                && d.OwnerType == DocumentOwnerType.ParkingSlot
                && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Build parking slot DTOs with documents
        var parkingSlotDtos = new List<ParkingSlotDto>();
        foreach (var item in items)
        {
            var slotDocuments = new List<DocumentDto>();
            foreach (var d in documents.Where(d => d.OwnerId == item.Id))
            {
                var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                    d.BlobPath,
                    60, // 60 minutes expiry
                    cancellationToken);

                slotDocuments.Add(new DocumentDto
                {
                    Id = d.Id,
                    FileName = d.FileName,
                    Title = d.Title,
                    Description = d.Description,
                    ContentType = d.ContentType,
                    SizeBytes = d.SizeBytes,
                    DownloadUrl = downloadUrl,
                    Category = d.Category.ToString(),
                    DisplayOrder = d.DisplayOrder,
                    ActionState = DocumentActionState.Active,
                    CreatedAt = d.CreatedAt
                });
            }

            var slotDto = item with
            {
                AllocatedUnitNumber = item.AllocatedUnitId.HasValue && unitNumbers.ContainsKey(item.AllocatedUnitId.Value)
                    ? unitNumbers[item.AllocatedUnitId.Value]
                    : null,
                Documents = slotDocuments
            };
            parkingSlotDtos.Add(slotDto);
        }

        var pagedResult = PagedResult<ParkingSlotDto>.Create(
            parkingSlotDtos,
            request.Page,
            request.PageSize,
            totalCount
        );

        return Result<PagedResult<ParkingSlotDto>>.Success(pagedResult);
    }
}
