using MediatR;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Queries.GetLeaseById;

/// <summary>
/// Query to get a lease by ID with all parties.
/// </summary>
public record GetLeaseByIdQuery(Guid LeaseId) : IRequest<Result<LeaseDto>>;
