using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.AddMaintenanceRequestDetail;

/// <summary>
/// Command to add a detail line to a maintenance request.
/// </summary>
public record AddMaintenanceRequestDetailCommand(
    Guid MaintenanceRequestId,
    MaintenanceDetailType LineType,
    string Description,
    decimal Quantity,
    string? UnitOfMeasure,
    decimal? EstimatedUnitPrice,
    bool IsBillable,
    int SortOrder = 0
) : IRequest<Result<Guid>>;
