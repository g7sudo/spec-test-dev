using MediatR;
using Savi.Application.Tenant.Me.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyPrivacySettings;

/// <summary>
/// Query to get the current user's privacy settings.
/// </summary>
public record GetMyPrivacySettingsQuery : IRequest<Result<PrivacySettingsDto>>;
