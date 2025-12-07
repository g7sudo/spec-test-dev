using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Devices.Commands.UnregisterDevice;

/// <summary>
/// Handler for UnregisterDeviceCommand.
/// </summary>
public sealed class UnregisterDeviceCommandHandler
    : IRequestHandler<UnregisterDeviceCommand, Result>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UnregisterDeviceCommandHandler> _logger;

    public UnregisterDeviceCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<UnregisterDeviceCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result> Handle(
        UnregisterDeviceCommand command,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        _logger.LogInformation(
            "Unregistering device {DeviceId} for user {UserId}",
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
            // Device not found - could be already unregistered
            _logger.LogWarning(
                "Device {DeviceId} not found for user {UserId} during unregister",
                command.DeviceId,
                userId);
            return Result.Success(); // Idempotent - return success
        }

        // Soft-delete the device
        device.Unregister(userId);

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Unregistered device {DeviceId} for user {UserId}",
            command.DeviceId,
            userId);

        return Result.Success();
    }
}
