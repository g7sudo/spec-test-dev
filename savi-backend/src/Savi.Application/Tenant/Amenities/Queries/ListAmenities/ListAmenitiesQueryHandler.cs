using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Queries.ListAmenities;

/// <summary>
/// Handler for ListAmenitiesQuery.
/// </summary>
public class ListAmenitiesQueryHandler
    : IRequestHandler<ListAmenitiesQuery, Result<PagedResult<AmenitySummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public ListAmenitiesQueryHandler(
        ITenantDbContext dbContext,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<PagedResult<AmenitySummaryDto>>> Handle(
        ListAmenitiesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Amenities
            .AsNoTracking()
            .Where(a => a.IsActive);

        // Apply filters
        if (request.Type.HasValue)
        {
            query = query.Where(a => a.Type == request.Type.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (request.IsBookable.HasValue)
        {
            query = query.Where(a => a.IsBookable == request.IsBookable.Value);
        }

        if (request.IsVisibleInApp.HasValue)
        {
            query = query.Where(a => a.IsVisibleInApp == request.IsVisibleInApp.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(a =>
                a.Name.ToLower().Contains(searchTerm) ||
                (a.Code != null && a.Code.ToLower().Contains(searchTerm)) ||
                (a.Description != null && a.Description.ToLower().Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results
        var amenities = await query
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (amenities.Count == 0)
        {
            return Result<PagedResult<AmenitySummaryDto>>.Success(
                new PagedResult<AmenitySummaryDto>(
                    Array.Empty<AmenitySummaryDto>(),
                    request.Page,
                    request.PageSize,
                    totalCount));
        }

        // Fetch primary images (first document) for all amenities in one query
        var amenityIds = amenities.Select(a => a.Id).ToList();
        var primaryDocuments = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => amenityIds.Contains(d.OwnerId)
                && d.OwnerType == DocumentOwnerType.Amenity
                && d.IsActive)
            .GroupBy(d => d.OwnerId)
            .Select(g => g.OrderBy(d => d.DisplayOrder).First())
            .ToListAsync(cancellationToken);

        // Build a dictionary for quick lookup
        var primaryImageUrls = new Dictionary<Guid, string>();
        foreach (var doc in primaryDocuments)
        {
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                doc.BlobPath,
                60,
                cancellationToken);
            primaryImageUrls[doc.OwnerId] = downloadUrl;
        }

        var items = amenities.Select(amenity => new AmenitySummaryDto
        {
            Id = amenity.Id,
            Name = amenity.Name,
            Code = amenity.Code,
            Type = amenity.Type,
            Status = amenity.Status,
            LocationText = amenity.LocationText,
            IsBookable = amenity.IsBookable,
            RequiresApproval = amenity.RequiresApproval,
            DepositRequired = amenity.DepositRequired,
            DepositAmount = amenity.DepositAmount,
            DisplayOrder = amenity.DisplayOrder,
            IsAvailableForBooking = amenity.IsAvailableForBooking,
            PrimaryImageUrl = primaryImageUrls.GetValueOrDefault(amenity.Id)
        }).ToList();

        var result = new PagedResult<AmenitySummaryDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<AmenitySummaryDto>>.Success(result);
    }
}
