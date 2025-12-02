using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Application.Tenant.Files.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Queries.GetUnitById;
/// <summary>
/// Handler for getting a unit by ID.
/// </summary>
public class GetUnitByIdQueryHandler : IRequestHandler<GetUnitByIdQuery, Result<UnitDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public GetUnitByIdQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }
    public async Task<Result<UnitDto>> Handle(GetUnitByIdQuery request, CancellationToken cancellationToken)
    {
        var unit = await _dbContext.Units
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new UnitDto
            {
                Id = x.Id,
                BlockId = x.BlockId,
                FloorId = x.FloorId,
                UnitTypeId = x.UnitTypeId,
                UnitNumber = x.UnitNumber,
                AreaSqft = x.AreaSqft,
                Status = x.Status.ToString(),
                Notes = x.Notes,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (unit == null)
        {
            throw new NotFoundException("Unit", request.Id);
        }
        // Get related entity names
        var blockName = await _dbContext.Blocks
            .Where(b => b.Id == unit.BlockId)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
        var floorName = await _dbContext.Floors
            .AsNoTracking()
            .Where(f => f.Id == unit.FloorId)
            .Select(f => f.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var unitTypeName = await _dbContext.UnitTypes
            .AsNoTracking()
            .Where(ut => ut.Id == unit.UnitTypeId)
            .Select(ut => ut.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        // Get documents (images) for this unit
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerType == DocumentOwnerType.Unit
                     && d.OwnerId == unit.Id
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

        var unitDto = unit with
        {
            BlockName = blockName,
            FloorName = floorName,
            UnitTypeName = unitTypeName,
            Documents = documentDtos
        };

        return Result<UnitDto>.Success(unitDto);
    }
}
