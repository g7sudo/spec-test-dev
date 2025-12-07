using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.CreateAnnouncement;

/// <summary>
/// Command to create a new announcement.
/// </summary>
public record CreateAnnouncementCommand(
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
    // Audience targeting
    List<CreateAnnouncementAudienceInput> Audiences,
    // Publishing options
    bool PublishImmediately = false,
    DateTime? ScheduledAt = null,
    DateTime? ExpiresAt = null,
    // Optional temporary document IDs for images
    List<string>? TempDocuments = null
) : IRequest<Result<Guid>>;

/// <summary>
/// Input for creating announcement audience.
/// </summary>
public record CreateAnnouncementAudienceInput(
    AudienceTargetType TargetType,
    Guid? BlockId = null,
    Guid? UnitId = null,
    Guid? RoleGroupId = null
);
