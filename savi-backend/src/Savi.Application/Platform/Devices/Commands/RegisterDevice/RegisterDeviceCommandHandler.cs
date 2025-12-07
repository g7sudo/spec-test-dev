using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Devices.Dtos;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Devices.Commands.RegisterDevice;

/// <summary>
/// Handler for RegisterDeviceCommand.
/// Registers a new device or updates an existing one.
/// </summary>
public sealed class RegisterDeviceCommandHandler
    : IRequestHandler<RegisterDeviceCommand, Result<RegisterDeviceResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<RegisterDeviceCommandHandler> _logger;

    public RegisterDeviceCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<RegisterDeviceCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<RegisterDeviceResponse>> Handle(
        RegisterDeviceCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        _logger.LogInformation(
            "Registering device {DeviceId} for user {UserId}",
            request.DeviceId,
            userId);

        // Parse platform enum
        if (!Enum.TryParse<DevicePlatform>(request.Platform, ignoreCase: true, out var platform))
        {
            return Result.Failure<RegisterDeviceResponse>("Invalid platform specified.");
        }

        // Check if device already exists for this user
        var existingDevice = await _platformDbContext.DeviceRegistrations
            .FirstOrDefaultAsync(d =>
                d.PlatformUserId == userId &&
                d.DeviceId == request.DeviceId &&
                d.IsActive,
                cancellationToken);

        if (existingDevice != null)
        {
            // Update existing device
            existingDevice.UpdateToken(request.DeviceToken, userId);
            existingDevice.UpdateDeviceInfo(
                request.DeviceName,
                request.AppVersion,
                request.OsVersion,
                userId);

            await _platformDbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Updated device token for device {DeviceId} (Registration {RegistrationId})",
                request.DeviceId,
                existingDevice.Id);

            return Result.Success(new RegisterDeviceResponse(
                DeviceRegistrationId: existingDevice.Id,
                DeviceId: request.DeviceId,
                IsNewRegistration: false));
        }

        // Check if this token is already registered to another device and deactivate it
        var existingTokenDevice = await _platformDbContext.DeviceRegistrations
            .FirstOrDefaultAsync(d =>
                d.DeviceToken == request.DeviceToken &&
                d.IsActive,
                cancellationToken);

        if (existingTokenDevice != null)
        {
            existingTokenDevice.Unregister(userId);
            _logger.LogInformation(
                "Deactivated previous device registration with same token. Old DeviceId: {OldDeviceId}",
                existingTokenDevice.DeviceId);
        }

        // Create new device registration
        var newDevice = DeviceRegistration.Create(
            platformUserId: userId,
            deviceToken: request.DeviceToken,
            deviceId: request.DeviceId,
            platform: platform,
            deviceName: request.DeviceName,
            appVersion: request.AppVersion,
            osVersion: request.OsVersion,
            createdBy: userId);

        _platformDbContext.Add(newDevice);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Registered new device {DeviceId} (Registration {RegistrationId}) for user {UserId}",
            request.DeviceId,
            newDevice.Id,
            userId);

        return Result.Success(new RegisterDeviceResponse(
            DeviceRegistrationId: newDevice.Id,
            DeviceId: request.DeviceId,
            IsNewRegistration: true));
    }
}
