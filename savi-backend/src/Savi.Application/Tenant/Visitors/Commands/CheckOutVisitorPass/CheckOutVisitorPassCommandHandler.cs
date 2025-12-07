using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.CheckOutVisitorPass;

/// <summary>
/// Handler for checking out a visitor.
/// </summary>
public class CheckOutVisitorPassCommandHandler
    : IRequestHandler<CheckOutVisitorPassCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CheckOutVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Unit>> Handle(
        CheckOutVisitorPassCommand request,
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

        // Validate status allows check-out
        if (visitorPass.Status != VisitorPassStatus.CheckedIn)
        {
            return Result<Unit>.Failure($"Cannot check out a pass with status '{visitorPass.Status}'.");
        }

        // Check out the visitor
        visitorPass.CheckOut(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
