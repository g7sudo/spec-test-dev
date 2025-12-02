using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Queries.ListFloorsByBlock;
/// <summary>
/// Handler for listing floors by block with pagination.
/// </summary>
public class ListFloorsByBlockQueryHandler : IRequestHandler<ListFloorsByBlockQuery, Result<PagedResult<FloorDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public ListFloorsByBlockQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }
    public async Task<Result<PagedResult<FloorDto>>> Handle(ListFloorsByBlockQuery request, CancellationToken cancellationToken)
    {
        // Get block name for the DTOs
        var blockName = await _dbContext.Blocks
            .AsNoTracking()
            .Where(b => b.Id == request.BlockId && b.IsActive)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken);

        if (blockName == null)
        {
            return Result<PagedResult<FloorDto>>.Failure($"Block with ID '{request.BlockId}' not found.");
        }

        var query = _dbContext.Floors
            .Where(x => x.BlockId == request.BlockId && x.IsActive);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.LevelNumber)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Fetch documents for all floors in this page
        var floorIds = items.Select(x => x.Id).ToList();
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => floorIds.Contains(d.OwnerId)
                && d.OwnerType == DocumentOwnerType.Floor
                && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Build floor DTOs with documents
        var floorDtos = new List<FloorDto>();
        foreach (var floor in items)
        {
            var floorDocuments = new List<DocumentDto>();
            foreach (var d in documents.Where(d => d.OwnerId == floor.Id))
            {
                var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                    d.BlobPath,
                    60,
                    cancellationToken);

                floorDocuments.Add(new DocumentDto
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

            floorDtos.Add(new FloorDto
            {
                Id = floor.Id,
                BlockId = floor.BlockId,
                BlockName = blockName,
                Name = floor.Name,
                LevelNumber = floor.LevelNumber,
                DisplayOrder = floor.DisplayOrder,
                Documents = floorDocuments,
                IsActive = floor.IsActive,
                CreatedAt = floor.CreatedAt
            });
        }

        var pagedResult = PagedResult<FloorDto>.Create(
            floorDtos,
            request.Page,
            request.PageSize,
            totalCount
        );

        return Result<PagedResult<FloorDto>>.Success(pagedResult);
    }
}
