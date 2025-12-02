using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Queries.GetFloorById;
/// <summary>
/// Handler for getting a floor by ID.
/// </summary>
public class GetFloorByIdQueryHandler : IRequestHandler<GetFloorByIdQuery, Result<FloorDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public GetFloorByIdQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }
    public async Task<Result<FloorDto>> Handle(GetFloorByIdQuery request, CancellationToken cancellationToken)
    {
        var floor = await _dbContext.Floors
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new
            {
                Floor = x,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == x.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault() ?? string.Empty
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (floor == null)
        {
            throw new NotFoundException("Floor", request.Id);
        }

        // Fetch documents for this floor
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerId == request.Id
                && d.OwnerType == DocumentOwnerType.Floor
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

        var floorDto = new FloorDto
        {
            Id = floor.Floor.Id,
            BlockId = floor.Floor.BlockId,
            BlockName = floor.BlockName,
            Name = floor.Floor.Name,
            LevelNumber = floor.Floor.LevelNumber,
            DisplayOrder = floor.Floor.DisplayOrder,
            Documents = documentDtos,
            IsActive = floor.Floor.IsActive,
            CreatedAt = floor.Floor.CreatedAt
        };

        return Result<FloorDto>.Success(floorDto);
    }
}
