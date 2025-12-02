using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Queries.GetBlockById;
/// <summary>
/// Handler for getting a block by ID.
/// </summary>
public class GetBlockByIdQueryHandler : IRequestHandler<GetBlockByIdQuery, Result<BlockDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public GetBlockByIdQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }
    public async Task<Result<BlockDto>> Handle(GetBlockByIdQuery request, CancellationToken cancellationToken)
    {
        var block = await _dbContext.Blocks
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new BlockDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                DisplayOrder = x.DisplayOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (block == null)
        {
            throw new NotFoundException("Block", request.Id);
        }

        // Fetch documents for this block
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerId == request.Id
                && d.OwnerType == DocumentOwnerType.Block
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

        var blockDto = block with
        {
            Documents = documentDtos
        };

        return Result<BlockDto>.Success(blockDto);
    }
}
