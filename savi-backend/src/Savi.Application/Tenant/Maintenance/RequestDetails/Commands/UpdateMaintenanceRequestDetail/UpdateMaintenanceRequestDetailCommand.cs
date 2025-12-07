using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.UpdateMaintenanceRequestDetail;

/// <summary>
/// Command to update a maintenance request detail line.
/// </summary>
public record UpdateMaintenanceRequestDetailCommand(
    Guid Id,
    MaintenanceDetailType LineType,
    string Description,
    decimal Quantity,
    string? UnitOfMeasure,
    decimal? EstimatedUnitPrice,
    bool IsBillable,
    int SortOrder
) : IRequest<Result>;
