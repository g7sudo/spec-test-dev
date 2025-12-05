using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Leases.Commands.EndLease;

/// <summary>
/// Handler for ending a lease.
/// </summary>
public class EndLeaseCommandHandler
    : IRequestHandler<EndLeaseCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public EndLeaseCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        EndLeaseCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Get the lease
        var lease = await _dbContext.Leases
            .FirstOrDefaultAsync(l => l.Id == request.LeaseId && l.IsActive, cancellationToken);

        if (lease == null)
        {
            return Result<Guid>.Failure($"Lease with ID '{request.LeaseId}' not found.");
        }

        if (lease.Status != LeaseStatus.Active)
        {
            return Result<Guid>.Failure("Only active leases can be ended.");
        }

        // End or terminate based on whether reason is provided
        if (!string.IsNullOrWhiteSpace(request.TerminationReason))
        {
            lease.Terminate(request.TerminationReason, _currentUser.TenantUserId.Value);
        }
        else
        {
            lease.End(_currentUser.TenantUserId.Value);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(lease.Id);
    }
}
