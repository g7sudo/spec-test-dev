using MediatR;
using Savi.Application.Tenant.Me.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyNotificationSettings;

/// <summary>
/// Query to get the current user's notification settings.
/// </summary>
public record GetMyNotificationSettingsQuery : IRequest<Result<NotificationSettingsDto>>;
