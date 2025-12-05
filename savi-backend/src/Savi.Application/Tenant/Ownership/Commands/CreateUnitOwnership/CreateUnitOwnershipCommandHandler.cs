using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Ownership.Commands.CreateUnitOwnership;

/// <summary>
/// Handler for creating unit ownership.
/// </summary>
public class CreateUnitOwnershipCommandHandler
    : IRequestHandler<CreateUnitOwnershipCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateUnitOwnershipCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateUnitOwnershipCommand request,
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

        // Verify party exists
        var partyExists = await _dbContext.Parties
            .AsNoTracking()
            .AnyAsync(p => p.Id == request.PartyId && p.IsActive, cancellationToken);

        if (!partyExists)
        {
            return Result<Guid>.Failure($"Party with ID '{request.PartyId}' not found.");
        }

        // Check if this party already has active ownership for this unit
        var existingOwnership = await _dbContext.UnitOwnerships
            .AsNoTracking()
            .AnyAsync(o =>
                o.UnitId == request.UnitId &&
                o.PartyId == request.PartyId &&
                o.IsActive &&
                o.ToDate == null,
                cancellationToken);

        if (existingOwnership)
        {
            return Result<Guid>.Failure(
                "This party already has an active ownership record for this unit.");
        }

        // Calculate total current ownership share
        // Note: SQLite doesn't support Sum on decimal, so we load values and sum client-side
        var currentOwnershipShares = await _dbContext.UnitOwnerships
            .AsNoTracking()
            .Where(o =>
                o.UnitId == request.UnitId &&
                o.IsActive &&
                o.ToDate == null)
            .Select(o => o.OwnershipShare)
            .ToListAsync(cancellationToken);

        var currentTotalShare = currentOwnershipShares.Sum();

        if (currentTotalShare + request.OwnershipShare > 100)
        {
            return Result<Guid>.Failure(
                $"Total ownership share would exceed 100%. Current total: {currentTotalShare}%, requested: {request.OwnershipShare}%.");
        }

        // If setting as primary owner, demote existing primary owner
        if (request.IsPrimaryOwner)
        {
            var existingPrimary = await _dbContext.UnitOwnerships
                .Where(o =>
                    o.UnitId == request.UnitId &&
                    o.IsActive &&
                    o.ToDate == null &&
                    o.IsPrimaryOwner)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingPrimary != null)
            {
                existingPrimary.SetPrimaryOwner(false, _currentUser.TenantUserId.Value);
            }
        }

        // Create ownership
        var ownership = UnitOwnership.Create(
            request.UnitId,
            request.PartyId,
            request.OwnershipShare,
            request.FromDate,
            request.IsPrimaryOwner,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(ownership);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(ownership.Id);
    }
}
