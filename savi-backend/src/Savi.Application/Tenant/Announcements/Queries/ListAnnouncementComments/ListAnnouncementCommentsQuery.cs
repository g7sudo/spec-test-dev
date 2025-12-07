using MediatR;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Queries.ListAnnouncementComments;

/// <summary>
/// Query to list comments for an announcement.
/// </summary>
public record ListAnnouncementCommentsQuery(
    Guid AnnouncementId,
    bool IncludeHidden = false, // Admin view can include hidden
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<AnnouncementCommentDto>>>;
