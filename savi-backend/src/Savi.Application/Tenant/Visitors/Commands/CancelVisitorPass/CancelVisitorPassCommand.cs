using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.CancelVisitorPass;

/// <summary>
/// Command to cancel a visitor pass.
/// </summary>
public record CancelVisitorPassCommand(Guid Id) : IRequest<Result<Unit>>;
