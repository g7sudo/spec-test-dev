using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyNotificationSettings;

/// <summary>
/// Command to update the current user's notification preferences.
/// </summary>
public record UpdateMyNotificationSettingsCommand : IRequest<Result<MediatR.Unit>>
{
    /// <summary>
    /// Whether push notifications are enabled.
    /// </summary>
    public bool PushEnabled { get; init; } = true;

    /// <summary>
    /// Whether email notifications are enabled.
    /// </summary>
    public bool EmailEnabled { get; init; } = false;

    /// <summary>
    /// Notify on maintenance request updates.
    /// </summary>
    public bool NotifyMaintenanceUpdates { get; init; } = true;

    /// <summary>
    /// Notify on amenity booking updates.
    /// </summary>
    public bool NotifyAmenityBookings { get; init; } = true;

    /// <summary>
    /// Notify when visitor arrives at gate.
    /// </summary>
    public bool NotifyVisitorAtGate { get; init; } = true;

    /// <summary>
    /// Notify on community announcements.
    /// </summary>
    public bool NotifyAnnouncements { get; init; } = true;

    /// <summary>
    /// Notify on marketplace activity.
    /// </summary>
    public bool NotifyMarketplace { get; init; } = true;
}

