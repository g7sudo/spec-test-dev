using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.GetFloorById;
/// <summary>
/// Query to get a floor by its ID.
/// </summary>
public record GetFloorByIdQuery(Guid Id) : IRequest<Result<FloorDto>>;
