using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Queries.GetTenants;

/// <summary>
/// Handles paginated tenant listing.
/// </summary>
public sealed class GetTenantsQueryHandler
    : IRequestHandler<GetTenantsQuery, Result<PagedResult<TenantSummaryDto>>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetTenantsQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<PagedResult<TenantSummaryDto>>> Handle(
        GetTenantsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _platformDbContext.Tenants.AsNoTracking();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.Trim().ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(searchTerm) ||
                (t.Code != null && t.Code.ToLower().Contains(searchTerm)) ||
                (t.City != null && t.City.ToLower().Contains(searchTerm)));
        }

        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(t => t.IsActive == request.IsActive.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and select
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TenantSummaryDto
            {
                Id = t.Id,
                Name = t.Name,
                Code = t.Code,
                Status = t.Status,
                City = t.City,
                Country = t.Country,
                CreatedAt = t.CreatedAt,
                IsActive = t.IsActive
            })
            .ToListAsync(cancellationToken);

        return Result.Success(PagedResult<TenantSummaryDto>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount));
    }
}
