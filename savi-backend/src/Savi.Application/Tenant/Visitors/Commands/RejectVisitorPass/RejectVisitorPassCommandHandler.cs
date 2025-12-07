using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.RejectVisitorPass;

/// <summary>
/// Handler for rejecting a visitor pass.
/// </summary>
public class RejectVisitorPassCommandHandler
    : IRequestHandler<RejectVisitorPassCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RejectVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Unit>> Handle(
        RejectVisitorPassCommand request,
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

        // Validate status allows rejection
        if (visitorPass.Status != VisitorPassStatus.PreRegistered &&
            visitorPass.Status != VisitorPassStatus.AtGatePendingApproval)
        {
            return Result<Unit>.Failure($"Cannot reject a pass with status '{visitorPass.Status}'.");
        }

        // Reject the pass
        visitorPass.Reject(request.Reason ?? "No reason provided", _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
