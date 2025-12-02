using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Queries.ListBlocks;
/// <summary>
/// Handler for listing blocks with pagination.
/// </summary>
public class ListBlocksQueryHandler : IRequestHandler<ListBlocksQuery, Result<PagedResult<BlockDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public ListBlocksQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }
    public async Task<Result<PagedResult<BlockDto>>> Handle(ListBlocksQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Blocks
            .AsNoTracking()
            .Where(x => x.IsActive);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Fetch documents for all blocks in this page
        var blockIds = items.Select(x => x.Id).ToList();
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => blockIds.Contains(d.OwnerId)
                && d.OwnerType == DocumentOwnerType.Block
                && d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Build block DTOs with documents
        var blockDtos = new List<BlockDto>();
        foreach (var block in items)
        {
            var blockDocuments = new List<DocumentDto>();
            foreach (var d in documents.Where(d => d.OwnerId == block.Id))
            {
                var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                    d.BlobPath,
                    60,
                    cancellationToken);

                blockDocuments.Add(new DocumentDto
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

            blockDtos.Add(new BlockDto
            {
                Id = block.Id,
                Name = block.Name,
                Description = block.Description,
                DisplayOrder = block.DisplayOrder,
                Documents = blockDocuments,
                IsActive = block.IsActive,
                CreatedAt = block.CreatedAt
            });
        }

        var pagedResult = PagedResult<BlockDto>.Create(
            blockDtos,
            request.Page,
            request.PageSize,
            totalCount
        );

        return Result<PagedResult<BlockDto>>.Success(pagedResult);
    }
}
