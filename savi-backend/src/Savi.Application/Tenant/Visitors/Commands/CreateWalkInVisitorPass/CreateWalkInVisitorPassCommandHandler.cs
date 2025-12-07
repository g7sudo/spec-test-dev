using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.CreateWalkInVisitorPass;

/// <summary>
/// Handler for creating a walk-in visitor pass.
/// </summary>
public class CreateWalkInVisitorPassCommandHandler
    : IRequestHandler<CreateWalkInVisitorPassCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateWalkInVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateWalkInVisitorPassCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<Guid>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Create the walk-in visitor pass
        var visitorPass = VisitorPass.CreateWalkIn(
            request.UnitId,
            request.VisitorName,
            request.VisitType,
            VisitorSource.SecurityApp,
            request.VisitorPhone,
            request.VisitorIdType,
            request.VisitorIdNumber,
            request.VehicleNumber,
            request.VehicleType,
            request.DeliveryProvider,
            request.Notes,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(visitorPass);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(visitorPass.Id);
    }
}
