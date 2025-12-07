using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Devices.Commands.UnregisterDevice;

/// <summary>
/// Command to unregister a device from push notifications.
/// Called when user logs out or disables notifications.
/// </summary>
public sealed record UnregisterDeviceCommand : IRequest<Result>
{
    /// <summary>
    /// The device ID to unregister.
    /// </summary>
    public string DeviceId { get; init; } = string.Empty;
}
