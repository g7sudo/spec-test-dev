using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.ListVisitorPasses;

/// <summary>
/// Handler for listing visitor passes.
/// </summary>
public class ListVisitorPassesQueryHandler
    : IRequestHandler<ListVisitorPassesQuery, Result<PagedResult<VisitorPassSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListVisitorPassesQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<VisitorPassSummaryDto>>> Handle(
        ListVisitorPassesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.VisitorPasses
            .AsNoTracking()
            .Where(v => v.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(v =>
                v.VisitorName.ToLower().Contains(searchTerm) ||
                (v.AccessCode != null && v.AccessCode.Contains(searchTerm)) ||
                (v.VisitorPhone != null && v.VisitorPhone.Contains(searchTerm)) ||
                (v.VehicleNumber != null && v.VehicleNumber.ToLower().Contains(searchTerm)));
        }

        if (request.UnitId.HasValue)
        {
            query = query.Where(v => v.UnitId == request.UnitId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(v => v.Status == request.Status.Value);
        }

        if (request.VisitType.HasValue)
        {
            query = query.Where(v => v.VisitType == request.VisitType.Value);
        }

        if (request.Source.HasValue)
        {
            query = query.Where(v => v.Source == request.Source.Value);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(v => v.CreatedAt >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(v => v.CreatedAt <= request.ToDate.Value);
        }

        if (request.CurrentlyInside == true)
        {
            query = query.Where(v => v.Status == VisitorPassStatus.CheckedIn && v.CheckOutAt == null);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and project to DTO
        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Join(
                _dbContext.Units.AsNoTracking(),
                v => v.UnitId,
                u => u.Id,
                (v, u) => new { Pass = v, Unit = u })
            .GroupJoin(
                _dbContext.Blocks.AsNoTracking(),
                vu => vu.Unit.BlockId,
                b => b.Id,
                (vu, blocks) => new { vu.Pass, vu.Unit, Blocks = blocks })
            .SelectMany(
                x => x.Blocks.DefaultIfEmpty(),
                (x, block) => new VisitorPassSummaryDto
                {
                    Id = x.Pass.Id,
                    UnitNumber = x.Unit.UnitNumber,
                    BlockName = block != null ? block.Name : null,
                    VisitType = x.Pass.VisitType,
                    Source = x.Pass.Source,
                    AccessCode = x.Pass.AccessCode,
                    VisitorName = x.Pass.VisitorName,
                    VisitorPhone = x.Pass.VisitorPhone,
                    DeliveryProvider = x.Pass.DeliveryProvider,
                    ExpectedFrom = x.Pass.ExpectedFrom,
                    ExpectedTo = x.Pass.ExpectedTo,
                    CheckInAt = x.Pass.CheckInAt,
                    CheckOutAt = x.Pass.CheckOutAt,
                    Status = x.Pass.Status,
                    CreatedAt = x.Pass.CreatedAt
                })
            .ToListAsync(cancellationToken);

        var result = new PagedResult<VisitorPassSummaryDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<VisitorPassSummaryDto>>.Success(result);
    }
}
