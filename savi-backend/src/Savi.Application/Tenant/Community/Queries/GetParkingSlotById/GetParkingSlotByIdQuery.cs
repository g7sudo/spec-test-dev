using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.GetParkingSlotById;
/// <summary>
/// Query to get a parking slot by its ID.
/// </summary>
public record GetParkingSlotByIdQuery(Guid Id) : IRequest<Result<ParkingSlotDto>>;
