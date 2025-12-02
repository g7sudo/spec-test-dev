using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListUnits;

/// <summary>
/// Handler for listing units with pagination and optional filtering.
/// </summary>
public class ListUnitsQueryHandler : IRequestHandler<ListUnitsQuery, Result<PagedResult<UnitDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public ListUnitsQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }
    public async Task<Result<PagedResult<UnitDto>>> Handle(ListUnitsQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Units
            .AsNoTracking()
            .Where(x => x.IsActive);
        // Apply filters
        if (request.BlockId.HasValue)
        {
            query = query.Where(x => x.BlockId == request.BlockId.Value);
        }
        if (request.FloorId.HasValue)
        {
            query = query.Where(x => x.FloorId == request.FloorId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Join with related entities to get names
        var items = await query
            .OrderBy(x => x.UnitNumber)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                Unit = x,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == x.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault() ?? string.Empty,
                FloorName = _dbContext.Floors
                    .Where(f => f.Id == x.FloorId)
                    .Select(f => f.Name)
                    .FirstOrDefault() ?? string.Empty,
                UnitTypeName = _dbContext.UnitTypes
                    .Where(ut => ut.Id == x.UnitTypeId)
                    .Select(ut => ut.Name)
                    .FirstOrDefault() ?? string.Empty
            })
            .ToListAsync(cancellationToken);

        // Fetch documents for all units in this page
        var unitIds = items.Select(x => x.Unit.Id).ToList();
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => unitIds.Contains(d.OwnerId)
                && d.OwnerType == DocumentOwnerType.Unit
                && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Build unit DTOs with documents
        var unitDtos = new List<UnitDto>();
        foreach (var item in items)
        {
            var unitDocuments = new List<DocumentDto>();
            foreach (var d in documents.Where(d => d.OwnerId == item.Unit.Id))
            {
                var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                    d.BlobPath,
                    60, // 60 minutes expiry
                    cancellationToken);

                unitDocuments.Add(new DocumentDto
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

            unitDtos.Add(new UnitDto
            {
                Id = item.Unit.Id,
                BlockId = item.Unit.BlockId,
                BlockName = item.BlockName,
                FloorId = item.Unit.FloorId,
                FloorName = item.FloorName,
                UnitTypeId = item.Unit.UnitTypeId,
                UnitTypeName = item.UnitTypeName,
                UnitNumber = item.Unit.UnitNumber,
                AreaSqft = item.Unit.AreaSqft,
                Status = item.Unit.Status.ToString(),
                Notes = item.Unit.Notes,
                Documents = unitDocuments,
                IsActive = item.Unit.IsActive,
                CreatedAt = item.Unit.CreatedAt
            });
        }

        var pagedResult = PagedResult<UnitDto>.Create(
            unitDtos,
            request.Page,
            request.PageSize,
            totalCount
        );

        return Result<PagedResult<UnitDto>>.Success(pagedResult);
    }
}
