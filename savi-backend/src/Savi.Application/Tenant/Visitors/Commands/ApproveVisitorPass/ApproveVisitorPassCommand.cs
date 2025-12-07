using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Commands.ApproveVisitorPass;

/// <summary>
/// Command to approve a visitor pass.
/// </summary>
public record ApproveVisitorPassCommand(Guid Id) : IRequest<Result<Unit>>;
