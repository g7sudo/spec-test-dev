using MediatR;
using Savi.Application.Tenant.Announcements.Commands.CreateAnnouncement;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.UpdateAnnouncement;

/// <summary>
/// Command to update an existing announcement.
/// </summary>
public record UpdateAnnouncementCommand(
    Guid Id,
    string Title,
    string Body,
    AnnouncementCategory Category,
    AnnouncementPriority Priority,
    bool IsPinned,
    bool IsBanner,
    bool AllowLikes,
    bool AllowComments,
    bool AllowAddToCalendar,
    bool IsEvent,
    DateTime? EventStartAt,
    DateTime? EventEndAt,
    bool IsAllDay,
    string? EventLocationText,
    string? EventJoinUrl,
    // Audience targeting (replaces existing audiences)
    List<CreateAnnouncementAudienceInput> Audiences,
    // Optional temporary document IDs for new images
    List<string>? TempDocuments = null,
    // Document IDs to remove
    List<Guid>? DocumentsToRemove = null
) : IRequest<Result>;
