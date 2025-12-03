using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Ownership.Commands.TransferOwnership;

/// <summary>
/// Handler for transferring ownership.
/// </summary>
public class TransferOwnershipCommandHandler
    : IRequestHandler<TransferOwnershipCommand, Result<List<Guid>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public TransferOwnershipCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<List<Guid>>> Handle(
        TransferOwnershipCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<List<Guid>>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Verify unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<List<Guid>>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Validate new owners
        if (request.NewOwners == null || !request.NewOwners.Any())
        {
            return Result<List<Guid>>.Failure("At least one new owner is required for transfer.");
        }

        // Validate total share equals 100%
        var totalShare = request.NewOwners.Sum(o => o.OwnershipShare);
        if (totalShare != 100)
        {
            return Result<List<Guid>>.Failure(
                $"Total ownership share must equal 100%. Current total: {totalShare}%.");
        }

        // Validate exactly one primary owner
        var primaryCount = request.NewOwners.Count(o => o.IsPrimaryOwner);
        if (primaryCount != 1)
        {
            return Result<List<Guid>>.Failure(
                "Exactly one owner must be marked as primary owner.");
        }

        // Verify all new owner parties exist
        var partyIds = request.NewOwners.Select(o => o.PartyId).Distinct().ToList();
        var existingPartyIds = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.IsActive && partyIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var missingParties = partyIds.Except(existingPartyIds).ToList();
        if (missingParties.Any())
        {
            return Result<List<Guid>>.Failure(
                $"Parties not found: {string.Join(", ", missingParties)}.");
        }

        // Start transaction
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);

        try
        {
            // End all current ownerships
            var currentOwnerships = await _dbContext.UnitOwnerships
                .Where(o =>
                    o.UnitId == request.UnitId &&
                    o.IsActive &&
                    o.ToDate == null)
                .ToListAsync(cancellationToken);

            // Set end date to one day before transfer date
            var endDate = request.TransferDate.AddDays(-1);
            foreach (var ownership in currentOwnerships)
            {
                ownership.EndOwnership(endDate, _currentUser.TenantUserId.Value);
            }

            // Create new ownerships
            var newOwnershipIds = new List<Guid>();
            foreach (var newOwner in request.NewOwners)
            {
                var ownership = UnitOwnership.Create(
                    request.UnitId,
                    newOwner.PartyId,
                    newOwner.OwnershipShare,
                    request.TransferDate,
                    newOwner.IsPrimaryOwner,
                    _currentUser.TenantUserId.Value);

                _dbContext.Add(ownership);
                newOwnershipIds.Add(ownership.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result<List<Guid>>.Success(newOwnershipIds);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<List<Guid>>.Failure($"Failed to transfer ownership: {ex.Message}");
        }
    }
}
