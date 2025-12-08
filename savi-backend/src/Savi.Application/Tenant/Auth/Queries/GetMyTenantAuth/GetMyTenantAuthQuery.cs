using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Auth.Queries.GetMyTenantAuth;

/// <summary>
/// Query to get the current user's auth context for a specific tenant.
/// Requires X-Tenant-Code header to be set.
/// </summary>
public sealed record GetMyTenantAuthQuery : IRequest<Result<TenantAuthMeResponseDto>>;
