using MediatR;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Queries.GetAnnouncementById;

/// <summary>
/// Query to get a single announcement by ID.
/// </summary>
public record GetAnnouncementByIdQuery(
    Guid Id,
    // For resident view - marks as read automatically
    bool ResidentView = false
) : IRequest<Result<AnnouncementDto>>;
