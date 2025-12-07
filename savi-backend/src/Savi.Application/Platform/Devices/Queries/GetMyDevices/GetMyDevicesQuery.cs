using MediatR;
using Savi.Application.Platform.Devices.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Devices.Queries.GetMyDevices;

/// <summary>
/// Query to get all registered devices for the current user.
/// </summary>
public sealed record GetMyDevicesQuery : IRequest<Result<List<DeviceDto>>>;
