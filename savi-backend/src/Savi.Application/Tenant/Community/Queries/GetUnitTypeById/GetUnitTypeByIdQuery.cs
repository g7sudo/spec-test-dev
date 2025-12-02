using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.GetUnitTypeById;
public record GetUnitTypeByIdQuery(Guid Id) : IRequest<Result<UnitTypeDto>>;
