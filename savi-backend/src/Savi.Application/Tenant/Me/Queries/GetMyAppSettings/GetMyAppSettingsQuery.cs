using MediatR;
using Savi.Application.Tenant.Me.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyAppSettings;

/// <summary>
/// Query to get the current user's app settings.
/// </summary>
public record GetMyAppSettingsQuery : IRequest<Result<AppSettingsDto>>;
