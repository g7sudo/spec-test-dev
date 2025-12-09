using MediatR;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetMyVisitors;

/// <summary>
/// Query to get visitor passes for the current user.
/// Respects permission hierarchy: CanViewAll → CanViewUnit → CanViewOwn.
/// </summary>
public record GetMyVisitorsQuery(
    VisitorPassStatus? Status = null,
    VisitorType? VisitType = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<VisitorPassSummaryDto>>>;
