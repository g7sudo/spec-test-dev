using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Leases.Commands.CreateLease;

/// <summary>
/// Handler for creating a new lease.
/// </summary>
public class CreateLeaseCommandHandler
    : IRequestHandler<CreateLeaseCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateLeaseCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateLeaseCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Verify unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<Guid>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Check for existing active lease on this unit
        var existingActiveLease = await _dbContext.Leases
            .AsNoTracking()
            .AnyAsync(l =>
                l.UnitId == request.UnitId &&
                l.IsActive &&
                (l.Status == LeaseStatus.Draft || l.Status == LeaseStatus.Active),
                cancellationToken);

        if (existingActiveLease)
        {
            return Result<Guid>.Failure(
                "This unit already has an active or draft lease. End or terminate the existing lease first.");
        }

        // Create lease
        var lease = Lease.Create(
            request.UnitId,
            request.StartDate,
            request.EndDate,
            request.MonthlyRent,
            request.DepositAmount,
            request.Notes,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(lease);

        // Add lease parties if provided
        if (request.Parties != null && request.Parties.Count > 0)
        {
            // Verify all parties exist
            var partyIds = request.Parties.Select(p => p.PartyId).ToList();
            var existingPartyIds = await _dbContext.Parties
                .AsNoTracking()
                .Where(p => partyIds.Contains(p.Id) && p.IsActive)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            var missingPartyIds = partyIds.Except(existingPartyIds).ToList();
            if (missingPartyIds.Count > 0)
            {
                return Result<Guid>.Failure(
                    $"Party IDs not found: {string.Join(", ", missingPartyIds)}");
            }

            // Validate only one primary party
            var primaryCount = request.Parties.Count(p => p.IsPrimary);
            if (primaryCount > 1)
            {
                return Result<Guid>.Failure("Only one party can be marked as primary.");
            }

            // Create lease parties
            foreach (var partyInput in request.Parties)
            {
                var leaseParty = LeaseParty.Create(
                    lease.Id,
                    partyInput.PartyId,
                    partyInput.Role,
                    partyInput.IsPrimary,
                    partyInput.MoveInDate,
                    _currentUser.TenantUserId.Value);

                _dbContext.Add(leaseParty);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(lease.Id);
    }
}
