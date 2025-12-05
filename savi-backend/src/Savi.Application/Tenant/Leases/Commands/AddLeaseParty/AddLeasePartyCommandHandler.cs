using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Leases.Commands.AddLeaseParty;

/// <summary>
/// Handler for adding a party to a lease.
/// </summary>
public class AddLeasePartyCommandHandler
    : IRequestHandler<AddLeasePartyCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AddLeasePartyCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        AddLeasePartyCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Verify lease exists and is modifiable (Draft or Active)
        var lease = await _dbContext.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == request.LeaseId && l.IsActive, cancellationToken);

        if (lease == null)
        {
            return Result<Guid>.Failure($"Lease with ID '{request.LeaseId}' not found.");
        }

        if (lease.Status != LeaseStatus.Draft && lease.Status != LeaseStatus.Active)
        {
            return Result<Guid>.Failure("Cannot add parties to ended or terminated leases.");
        }

        // Verify party exists
        var partyExists = await _dbContext.Parties
            .AsNoTracking()
            .AnyAsync(p => p.Id == request.PartyId && p.IsActive, cancellationToken);

        if (!partyExists)
        {
            return Result<Guid>.Failure($"Party with ID '{request.PartyId}' not found.");
        }

        // Check if party already exists on this lease
        var existingParty = await _dbContext.LeaseParties
            .AsNoTracking()
            .AnyAsync(lp =>
                lp.LeaseId == request.LeaseId &&
                lp.PartyId == request.PartyId &&
                lp.IsActive,
                cancellationToken);

        if (existingParty)
        {
            return Result<Guid>.Failure("This party is already on this lease.");
        }

        // If setting as primary, demote existing primary
        if (request.IsPrimary)
        {
            var existingPrimary = await _dbContext.LeaseParties
                .Where(lp =>
                    lp.LeaseId == request.LeaseId &&
                    lp.IsActive &&
                    lp.IsPrimary)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingPrimary != null)
            {
                existingPrimary.SetPrimary(false, _currentUser.TenantUserId.Value);
            }
        }

        // Create lease party
        var leaseParty = LeaseParty.Create(
            request.LeaseId,
            request.PartyId,
            request.Role,
            request.IsPrimary,
            request.MoveInDate,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(leaseParty);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(leaseParty.Id);
    }
}
