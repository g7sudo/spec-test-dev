using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.CheckInVisitorPass;

/// <summary>
/// Command to check in a visitor at the gate.
/// </summary>
public record CheckInVisitorPassCommand(Guid Id) : IRequest<Result<Unit>>;
