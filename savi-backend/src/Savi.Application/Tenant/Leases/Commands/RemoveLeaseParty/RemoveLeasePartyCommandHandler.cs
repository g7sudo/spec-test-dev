using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Leases.Commands.RemoveLeaseParty;

/// <summary>
/// Handler for removing a party from a lease.
/// </summary>
public class RemoveLeasePartyCommandHandler
    : IRequestHandler<RemoveLeasePartyCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RemoveLeasePartyCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        RemoveLeasePartyCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Get the lease party with lease info
        var leaseParty = await _dbContext.LeaseParties
            .FirstOrDefaultAsync(lp => lp.Id == request.LeasePartyId && lp.IsActive, cancellationToken);

        if (leaseParty == null)
        {
            return Result<bool>.Failure($"Lease party with ID '{request.LeasePartyId}' not found.");
        }

        // Verify lease is modifiable
        var lease = await _dbContext.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == leaseParty.LeaseId && l.IsActive, cancellationToken);

        if (lease == null)
        {
            return Result<bool>.Failure("Associated lease not found.");
        }

        if (lease.Status != LeaseStatus.Draft && lease.Status != LeaseStatus.Active)
        {
            return Result<bool>.Failure("Cannot remove parties from ended or terminated leases.");
        }

        // Check if this is the only primary resident
        if (leaseParty.IsPrimary && leaseParty.Role == LeasePartyRole.PrimaryResident)
        {
            var otherPrimaryResidents = await _dbContext.LeaseParties
                .AsNoTracking()
                .CountAsync(lp =>
                    lp.LeaseId == leaseParty.LeaseId &&
                    lp.Id != leaseParty.Id &&
                    lp.IsActive &&
                    lp.IsPrimary &&
                    lp.Role == LeasePartyRole.PrimaryResident,
                    cancellationToken);

            if (otherPrimaryResidents == 0 && lease.Status == LeaseStatus.Active)
            {
                return Result<bool>.Failure(
                    "Cannot remove the only primary resident from an active lease. Add another primary resident first or end the lease.");
            }
        }

        // Soft delete the lease party
        leaseParty.Deactivate(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
