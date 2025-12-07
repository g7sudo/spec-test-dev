using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.CreateWalkInVisitorPass;

/// <summary>
/// Command to create a walk-in visitor pass (security guard flow).
/// </summary>
public record CreateWalkInVisitorPassCommand(
    Guid UnitId,
    string VisitorName,
    VisitorType VisitType = VisitorType.Guest,
    string? VisitorPhone = null,
    string? VisitorIdType = null,
    string? VisitorIdNumber = null,
    string? VehicleNumber = null,
    string? VehicleType = null,
    string? DeliveryProvider = null,
    string? Notes = null
) : IRequest<Result<Guid>>;
