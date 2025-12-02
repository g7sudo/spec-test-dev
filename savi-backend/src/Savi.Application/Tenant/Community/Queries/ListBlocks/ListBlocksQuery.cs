using MediatR;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Queries.ListBlocks;
/// <summary>
/// Query to list all blocks with pagination.
/// </summary>
public record ListBlocksQuery(
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<BlockDto>>>;
