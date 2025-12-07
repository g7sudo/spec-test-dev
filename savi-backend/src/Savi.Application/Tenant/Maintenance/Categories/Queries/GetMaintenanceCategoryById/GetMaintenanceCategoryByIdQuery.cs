using MediatR;
using Savi.Application.Tenant.Maintenance.Categories.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Queries.GetMaintenanceCategoryById;

/// <summary>
/// Query to get a maintenance category by ID.
/// </summary>
public record GetMaintenanceCategoryByIdQuery(Guid Id) : IRequest<Result<MaintenanceCategoryDto>>;
