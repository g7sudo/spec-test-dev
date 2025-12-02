using MediatR;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Queries.GetBlockById;
/// <summary>
/// Query to get a block by its ID.
/// </summary>
public record GetBlockByIdQuery(Guid Id) : IRequest<Result<BlockDto>>;
