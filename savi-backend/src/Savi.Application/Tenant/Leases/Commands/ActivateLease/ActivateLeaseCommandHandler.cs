using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Leases.Commands.ActivateLease;

/// <summary>
/// Handler for activating a lease.
/// </summary>
public class ActivateLeaseCommandHandler
    : IRequestHandler<ActivateLeaseCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public ActivateLeaseCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        ActivateLeaseCommand request,
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

        if (lease.Status != LeaseStatus.Draft)
        {
            return Result<Guid>.Failure("Only draft leases can be activated.");
        }

        // Check that at least one primary resident exists
        var hasPrimaryResident = await _dbContext.LeaseParties
            .AsNoTracking()
            .AnyAsync(lp =>
                lp.LeaseId == request.LeaseId &&
                lp.IsActive &&
                lp.IsPrimary &&
                lp.Role == LeasePartyRole.PrimaryResident,
                cancellationToken);

        if (!hasPrimaryResident)
        {
            return Result<Guid>.Failure(
                "Cannot activate lease without a primary resident. Add at least one primary resident first.");
        }

        // Activate the lease
        lease.Activate(_currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(lease.Id);
    }
}
