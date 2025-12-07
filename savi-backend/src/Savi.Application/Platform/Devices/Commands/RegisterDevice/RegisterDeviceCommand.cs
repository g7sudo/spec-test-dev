using MediatR;
using Savi.Application.Platform.Devices.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Devices.Commands.RegisterDevice;

/// <summary>
/// Command to register a mobile device for push notifications.
/// If the device already exists (by DeviceId), it updates the token.
/// </summary>
public sealed record RegisterDeviceCommand : IRequest<Result<RegisterDeviceResponse>>
{
    public RegisterDeviceRequest Request { get; init; } = new();
}
