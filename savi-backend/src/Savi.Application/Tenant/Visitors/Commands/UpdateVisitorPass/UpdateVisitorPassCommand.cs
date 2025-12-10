using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.UpdateVisitorPass;

/// <summary>
/// Command to update a visitor pass.
/// </summary>
public record UpdateVisitorPassCommand(
    Guid Id,
    string VisitorName,
    string? VisitorPhone = null,
    string? VehicleNumber = null,
    string? VehicleType = null,
    string? Notes = null
) : IRequest<Result<Unit>>;
