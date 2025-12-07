using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.CreateMaintenanceCategory;

/// <summary>
/// Command to create a new maintenance category.
/// </summary>
public record CreateMaintenanceCategoryCommand(
    string Name,
    string? Code,
    string? Description,
    int DisplayOrder = 0,
    bool IsDefault = false
) : IRequest<Result<Guid>>;
