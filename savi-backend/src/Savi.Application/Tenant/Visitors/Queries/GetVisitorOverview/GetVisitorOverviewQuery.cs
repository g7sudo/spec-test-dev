using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetVisitorOverview;

/// <summary>
/// Query to get visitor overview statistics for admin dashboard.
/// </summary>
public record GetVisitorOverviewQuery(
    DateTime? Date = null
) : IRequest<Result<VisitorOverviewDto>>;

/// <summary>
/// Overview statistics for visitor management dashboard.
/// </summary>
public record VisitorOverviewDto
{
    /// <summary>
    /// Total visitor passes created today (or specified date).
    /// </summary>
    public int TotalToday { get; init; }

    /// <summary>
    /// Number of visitors currently inside (checked in but not checked out).
    /// </summary>
    public int CurrentlyInside { get; init; }

    /// <summary>
    /// Number of visitors pending approval (walk-ins waiting for resident response).
    /// </summary>
    public int PendingApproval { get; init; }

    /// <summary>
    /// Number of pre-registered passes for today that haven't been used yet.
    /// </summary>
    public int PreRegisteredPending { get; init; }

    /// <summary>
    /// Number of visitors checked in today.
    /// </summary>
    public int CheckedInToday { get; init; }

    /// <summary>
    /// Number of visitors checked out today.
    /// </summary>
    public int CheckedOutToday { get; init; }

    /// <summary>
    /// Number of passes rejected today.
    /// </summary>
    public int RejectedToday { get; init; }

    /// <summary>
    /// Number of passes expired today.
    /// </summary>
    public int ExpiredToday { get; init; }

    /// <summary>
    /// Breakdown by visitor type.
    /// </summary>
    public VisitorTypeBreakdown ByType { get; init; } = new();

    /// <summary>
    /// Breakdown by source.
    /// </summary>
    public VisitorSourceBreakdown BySource { get; init; } = new();
}

/// <summary>
/// Breakdown of visitors by type.
/// </summary>
public record VisitorTypeBreakdown
{
    public int Guest { get; init; }
    public int Delivery { get; init; }
    public int Service { get; init; }
    public int Other { get; init; }
}

/// <summary>
/// Breakdown of visitors by source.
/// </summary>
public record VisitorSourceBreakdown
{
    public int MobileApp { get; init; }
    public int SecurityApp { get; init; }
    public int AdminPortal { get; init; }
    public int Other { get; init; }
}
