using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.CancelVisitorPass;

/// <summary>
/// Handler for cancelling a visitor pass.
/// </summary>
public class CancelVisitorPassCommandHandler
    : IRequestHandler<CancelVisitorPassCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CancelVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Unit>> Handle(
        CancelVisitorPassCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Unit>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Find the visitor pass
        var visitorPass = await _dbContext.VisitorPasses
            .FirstOrDefaultAsync(v => v.Id == request.Id && v.IsActive, cancellationToken);

        if (visitorPass == null)
        {
            return Result<Unit>.Failure($"Visitor pass with ID '{request.Id}' not found.");
        }

        // Validate status allows cancellation
        if (visitorPass.Status == VisitorPassStatus.CheckedIn ||
            visitorPass.Status == VisitorPassStatus.CheckedOut)
        {
            return Result<Unit>.Failure($"Cannot cancel a pass with status '{visitorPass.Status}'.");
        }

        if (visitorPass.Status == VisitorPassStatus.Cancelled)
        {
            return Result<Unit>.Failure("Pass is already cancelled.");
        }

        // Cancel the pass
        visitorPass.Cancel(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
