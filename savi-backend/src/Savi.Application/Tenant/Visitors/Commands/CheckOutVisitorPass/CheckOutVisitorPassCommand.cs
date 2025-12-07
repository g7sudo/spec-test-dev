using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.CheckOutVisitorPass;

/// <summary>
/// Command to check out a visitor.
/// </summary>
public record CheckOutVisitorPassCommand(Guid Id) : IRequest<Result<Unit>>;
