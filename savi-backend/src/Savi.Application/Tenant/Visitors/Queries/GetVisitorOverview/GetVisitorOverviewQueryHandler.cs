using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetVisitorOverview;

/// <summary>
/// Handler for getting visitor overview statistics.
/// </summary>
public class GetVisitorOverviewQueryHandler
    : IRequestHandler<GetVisitorOverviewQuery, Result<VisitorOverviewDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetVisitorOverviewQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<VisitorOverviewDto>> Handle(
        GetVisitorOverviewQuery request,
        CancellationToken cancellationToken)
    {
        var targetDate = request.Date?.Date ?? DateTime.UtcNow.Date;
        var nextDate = targetDate.AddDays(1);

        // Get all active passes
        var allPasses = _dbContext.VisitorPasses
            .AsNoTracking()
            .Where(v => v.IsActive);

        // Currently inside (checked in but not checked out)
        var currentlyInside = await allPasses
            .CountAsync(v => v.Status == VisitorPassStatus.CheckedIn && v.CheckOutAt == null, cancellationToken);

        // Pending approval
        var pendingApproval = await allPasses
            .CountAsync(v => v.Status == VisitorPassStatus.AtGatePendingApproval, cancellationToken);

        // Pre-registered passes for today that haven't been used
        var preRegisteredPending = await allPasses
            .CountAsync(v =>
                v.Status == VisitorPassStatus.PreRegistered &&
                ((v.ExpectedFrom >= targetDate && v.ExpectedFrom < nextDate) ||
                 (v.ExpectedFrom == null && v.CreatedAt >= targetDate && v.CreatedAt < nextDate)),
                cancellationToken);

        // Today's statistics (based on CreatedAt or action timestamps)
        var todayPasses = allPasses.Where(v => v.CreatedAt >= targetDate && v.CreatedAt < nextDate);

        var totalToday = await todayPasses.CountAsync(cancellationToken);

        var checkedInToday = await allPasses
            .CountAsync(v => v.CheckInAt >= targetDate && v.CheckInAt < nextDate, cancellationToken);

        var checkedOutToday = await allPasses
            .CountAsync(v => v.CheckOutAt >= targetDate && v.CheckOutAt < nextDate, cancellationToken);

        var rejectedToday = await allPasses
            .CountAsync(v => v.RejectedAt >= targetDate && v.RejectedAt < nextDate, cancellationToken);

        var expiredToday = await allPasses
            .CountAsync(v =>
                v.Status == VisitorPassStatus.Expired &&
                v.UpdatedAt >= targetDate && v.UpdatedAt < nextDate,
                cancellationToken);

        // Breakdown by type (for today)
        var byTypeData = await todayPasses
            .GroupBy(v => v.VisitType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byType = new VisitorTypeBreakdown
        {
            Guest = byTypeData.FirstOrDefault(x => x.Type == VisitorType.Guest)?.Count ?? 0,
            Delivery = byTypeData.FirstOrDefault(x => x.Type == VisitorType.Delivery)?.Count ?? 0,
            Service = byTypeData.FirstOrDefault(x => x.Type == VisitorType.Service)?.Count ?? 0,
            Other = byTypeData.FirstOrDefault(x => x.Type == VisitorType.Other)?.Count ?? 0
        };

        // Breakdown by source (for today)
        var bySourceData = await todayPasses
            .GroupBy(v => v.Source)
            .Select(g => new { Source = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var bySource = new VisitorSourceBreakdown
        {
            MobileApp = bySourceData.FirstOrDefault(x => x.Source == VisitorSource.MobileApp)?.Count ?? 0,
            SecurityApp = bySourceData.FirstOrDefault(x => x.Source == VisitorSource.SecurityApp)?.Count ?? 0,
            AdminPortal = bySourceData.FirstOrDefault(x => x.Source == VisitorSource.AdminPortal)?.Count ?? 0,
            Other = bySourceData.FirstOrDefault(x => x.Source == VisitorSource.Other)?.Count ?? 0
        };

        var overview = new VisitorOverviewDto
        {
            TotalToday = totalToday,
            CurrentlyInside = currentlyInside,
            PendingApproval = pendingApproval,
            PreRegisteredPending = preRegisteredPending,
            CheckedInToday = checkedInToday,
            CheckedOutToday = checkedOutToday,
            RejectedToday = rejectedToday,
            ExpiredToday = expiredToday,
            ByType = byType,
            BySource = bySource
        };

        return Result<VisitorOverviewDto>.Success(overview);
    }
}
