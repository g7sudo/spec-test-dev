using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.DeleteMaintenanceCategory;

/// <summary>
/// Command to delete (soft-delete) a maintenance category.
/// </summary>
public record DeleteMaintenanceCategoryCommand(Guid Id) : IRequest<Result<bool>>;
