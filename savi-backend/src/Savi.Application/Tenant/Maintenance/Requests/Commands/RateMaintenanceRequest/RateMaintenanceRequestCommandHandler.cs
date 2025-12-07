using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.RateMaintenanceRequest;

/// <summary>
/// Handler for submitting a rating for a completed maintenance request.
/// </summary>
public class RateMaintenanceRequestCommandHandler
    : IRequestHandler<RateMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RateMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        RateMaintenanceRequestCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .FirstOrDefaultAsync(r => r.Id == request.RequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result.Failure($"Maintenance request with ID '{request.RequestId}' not found.");
        }

        if (maintenanceRequest.Status != MaintenanceStatus.Completed)
        {
            return Result.Failure("Can only rate completed requests.");
        }

        if (request.Rating < 1 || request.Rating > 5)
        {
            return Result.Failure("Rating must be between 1 and 5.");
        }

        maintenanceRequest.Rate(request.Rating, request.Feedback, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
