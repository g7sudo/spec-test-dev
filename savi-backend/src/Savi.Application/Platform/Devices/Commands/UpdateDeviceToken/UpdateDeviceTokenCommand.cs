using MediatR;
using Savi.Application.Platform.Devices.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Devices.Commands.UpdateDeviceToken;

/// <summary>
/// Command to update the FCM token for an existing device.
/// Used when Firebase SDK refreshes the device token.
/// </summary>
public sealed record UpdateDeviceTokenCommand : IRequest<Result>
{
    /// <summary>
    /// The device ID to update.
    /// </summary>
    public string DeviceId { get; init; } = string.Empty;

    /// <summary>
    /// The update request containing the new token.
    /// </summary>
    public UpdateDeviceTokenRequest Request { get; init; } = new();
}
