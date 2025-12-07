using MediatR;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.ListVisitorPasses;

/// <summary>
/// Query to list visitor passes with filtering and pagination.
/// </summary>
public record ListVisitorPassesQuery(
    string? SearchTerm = null,
    Guid? UnitId = null,
    VisitorPassStatus? Status = null,
    VisitorType? VisitType = null,
    VisitorSource? Source = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool? CurrentlyInside = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<VisitorPassSummaryDto>>>;
