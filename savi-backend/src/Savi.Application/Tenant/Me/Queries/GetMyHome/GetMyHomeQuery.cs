using MediatR;
using Savi.Application.Tenant.Me.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyHome;

/// <summary>
/// Query to get the current user's home information.
/// Returns units, leases, and co-residents for the logged-in user.
/// </summary>
public record GetMyHomeQuery : IRequest<Result<MyHomeDto>>;
