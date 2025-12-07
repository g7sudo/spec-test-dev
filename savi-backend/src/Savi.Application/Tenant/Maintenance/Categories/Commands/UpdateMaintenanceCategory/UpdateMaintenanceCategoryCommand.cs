using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.UpdateMaintenanceCategory;

/// <summary>
/// Command to update an existing maintenance category.
/// </summary>
public record UpdateMaintenanceCategoryCommand(
    Guid Id,
    string Name,
    string? Code,
    string? Description,
    int DisplayOrder,
    bool IsDefault
) : IRequest<Result<bool>>;
