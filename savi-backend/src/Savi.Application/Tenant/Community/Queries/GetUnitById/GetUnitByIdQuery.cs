using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.GetUnitById;
/// <summary>
/// Query to get a unit by its ID.
/// </summary>
public record GetUnitByIdQuery(Guid Id) : IRequest<Result<UnitDto>>;
