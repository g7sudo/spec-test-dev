using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.CheckInVisitorPass;

/// <summary>
/// Handler for checking in a visitor.
/// </summary>
public class CheckInVisitorPassCommandHandler
    : IRequestHandler<CheckInVisitorPassCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CheckInVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Unit>> Handle(
        CheckInVisitorPassCommand request,
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

        // Validate the pass is valid for check-in
        if (!visitorPass.IsValidForCheckIn())
        {
            return Result<Unit>.Failure(
                $"Visitor pass is not valid for check-in. Status: '{visitorPass.Status}', or the pass may have expired.");
        }

        // Check in the visitor
        visitorPass.CheckIn(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
