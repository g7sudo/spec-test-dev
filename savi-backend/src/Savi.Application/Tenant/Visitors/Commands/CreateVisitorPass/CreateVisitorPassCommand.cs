using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.CreateVisitorPass;

/// <summary>
/// Command to create a new pre-registered visitor pass (resident flow).
/// </summary>
public record CreateVisitorPassCommand(
    Guid UnitId,
    string VisitorName,
    VisitorType VisitType = VisitorType.Guest,
    string? VisitorPhone = null,
    string? VehicleNumber = null,
    string? VehicleType = null,
    string? DeliveryProvider = null,
    string? Notes = null,
    DateTime? ExpectedFrom = null,
    DateTime? ExpectedTo = null,
    bool NotifyVisitorAtGate = true
) : IRequest<Result<CreateVisitorPassResult>>;

/// <summary>
/// Result of creating a visitor pass.
/// </summary>
public record CreateVisitorPassResult(Guid Id, string AccessCode);
