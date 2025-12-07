using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.RejectVisitorPass;

/// <summary>
/// Command to reject a visitor pass.
/// </summary>
public record RejectVisitorPassCommand(Guid Id, string? Reason = null) : IRequest<Result<Unit>>;
