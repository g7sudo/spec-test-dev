using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Devices.Commands.UpdateDeviceToken;

/// <summary>
/// Handler for UpdateDeviceTokenCommand.
/// </summary>
public sealed class UpdateDeviceTokenCommandHandler
    : IRequestHandler<UpdateDeviceTokenCommand, Result>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateDeviceTokenCommandHandler> _logger;

    public UpdateDeviceTokenCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<UpdateDeviceTokenCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result> Handle(
        UpdateDeviceTokenCommand command,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        _logger.LogInformation(
            "Updating device token for device {DeviceId} for user {UserId}",
            command.DeviceId,
            userId);

        // Find the device
        var device = await _platformDbContext.DeviceRegistrations
            .FirstOrDefaultAsync(d =>
                d.PlatformUserId == userId &&
                d.DeviceId == command.DeviceId &&
                d.IsActive,
                cancellationToken);

        if (device == null)
        {
            return Result.Failure("Device not found or not registered to this user.");
        }

        // Update the token
        device.UpdateToken(command.Request.DeviceToken, userId);

        // Update device info if provided
        if (!string.IsNullOrEmpty(command.Request.AppVersion) ||
            !string.IsNullOrEmpty(command.Request.OsVersion))
        {
            device.UpdateDeviceInfo(
                deviceName: null,
                appVersion: command.Request.AppVersion,
                osVersion: command.Request.OsVersion,
                updatedBy: userId);
        }

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated device token for device {DeviceId}",
            command.DeviceId);

        return Result.Success();
    }
}
