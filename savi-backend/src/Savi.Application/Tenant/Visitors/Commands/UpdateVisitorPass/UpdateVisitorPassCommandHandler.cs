using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.UpdateVisitorPass;

/// <summary>
/// Handler for updating a visitor pass.
/// </summary>
public class UpdateVisitorPassCommandHandler
    : IRequestHandler<UpdateVisitorPassCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Unit>> Handle(
        UpdateVisitorPassCommand request,
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

        // Validate status allows update
        if (visitorPass.Status == VisitorPassStatus.CheckedIn ||
            visitorPass.Status == VisitorPassStatus.CheckedOut)
        {
            return Result<Unit>.Failure($"Cannot update a pass with status '{visitorPass.Status}'.");
        }

        // Update the pass
        visitorPass.UpdateVisitorDetails(
            request.VisitorName,
            request.VisitorPhone,
            visitorIdType: null,
            visitorIdNumber: null,
            request.VehicleNumber,
            request.VehicleType,
            request.Notes,
            _currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
