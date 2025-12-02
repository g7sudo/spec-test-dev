using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Queries.GetTenantById;

/// <summary>
/// Query to retrieve a single tenant by ID.
/// </summary>
public sealed record GetTenantByIdQuery(Guid Id) : IRequest<Result<TenantDto>>;
