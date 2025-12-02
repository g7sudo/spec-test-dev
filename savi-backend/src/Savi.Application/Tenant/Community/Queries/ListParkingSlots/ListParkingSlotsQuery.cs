using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListParkingSlots;
/// <summary>
/// Query to list parking slots with optional filtering and pagination.
/// </summary>
public record ListParkingSlotsQuery(
    Guid? AllocatedUnitId = null,
    ParkingStatus? Status = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<ParkingSlotDto>>>;
