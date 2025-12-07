using MediatR;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Queries.ListAnnouncements;

/// <summary>
/// Query to list announcements with filtering and pagination.
/// </summary>
public record ListAnnouncementsQuery(
    // Filters
    AnnouncementStatus? Status = null,
    AnnouncementCategory? Category = null,
    AnnouncementPriority? Priority = null,
    bool? IsPinned = null,
    bool? IsEvent = null,
    string? SearchTerm = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    // For resident view - only show published and non-expired
    bool ResidentView = false,
    // Pagination
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<AnnouncementSummaryDto>>>;
