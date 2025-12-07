using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Devices.Dtos;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Devices.Queries.GetMyDevices;

/// <summary>
/// Handler for GetMyDevicesQuery.
/// </summary>
public sealed class GetMyDevicesQueryHandler
    : IRequestHandler<GetMyDevicesQuery, Result<List<DeviceDto>>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;

    public GetMyDevicesQueryHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<List<DeviceDto>>> Handle(
        GetMyDevicesQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var devices = await _platformDbContext.DeviceRegistrations
            .Where(d => d.PlatformUserId == userId && d.IsActive)
            .OrderByDescending(d => d.LastActiveAt ?? d.CreatedAt)
            .Select(d => new DeviceDto(
                d.Id,
                d.DeviceId,
                d.DeviceName,
                d.Platform,
                d.AppVersion,
                d.OsVersion,
                d.IsActive,
                d.LastActiveAt,
                d.CreatedAt))
            .ToListAsync(cancellationToken);

        return Result.Success(devices);
    }
}
