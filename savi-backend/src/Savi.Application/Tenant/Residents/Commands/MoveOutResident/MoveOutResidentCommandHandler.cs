using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Residents.Commands.MoveOutResident;

/// <summary>
/// Handler for MoveOutResidentCommand.
/// Properly sets MoveOutDate on LeaseParty and handles primary resident move-out logic.
/// </summary>
public class MoveOutResidentCommandHandler
    : IRequestHandler<MoveOutResidentCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public MoveOutResidentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        MoveOutResidentCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var userId = _currentUser.TenantUserId.Value;

        // Get the lease party
        var leaseParty = await _dbContext.LeaseParties
            .FirstOrDefaultAsync(lp => lp.Id == request.LeasePartyId && lp.IsActive, cancellationToken);

        if (leaseParty == null)
        {
            return Result<bool>.Failure($"Lease party with ID '{request.LeasePartyId}' not found.");
        }

        // Check if already moved out
        if (leaseParty.MoveOutDate.HasValue)
        {
            return Result<bool>.Failure("This resident has already been moved out.");
        }

        // Validate move-out date is not before move-in date
        if (leaseParty.MoveInDate.HasValue && request.MoveOutDate < leaseParty.MoveInDate.Value)
        {
            return Result<bool>.Failure("Move-out date cannot be before move-in date.");
        }

        // Get the lease
        var lease = await _dbContext.Leases
            .FirstOrDefaultAsync(l => l.Id == leaseParty.LeaseId && l.IsActive, cancellationToken);

        if (lease == null)
        {
            return Result<bool>.Failure("Associated lease not found.");
        }

        // Only allow move-out from active leases
        if (lease.Status != LeaseStatus.Active)
        {
            return Result<bool>.Failure("Can only move out residents from active leases.");
        }

        // Handle primary resident move-out
        if (leaseParty.IsPrimary && leaseParty.Role == LeasePartyRole.PrimaryResident)
        {
            return await HandlePrimaryResidentMoveOut(
                leaseParty, lease, request, userId, cancellationToken);
        }

        // Non-primary resident: just set move-out date
        leaseParty.SetMoveOutDate(request.MoveOutDate, userId);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }

    private async Task<Result<bool>> HandlePrimaryResidentMoveOut(
        Domain.Tenant.LeaseParty leaseParty,
        Domain.Tenant.Lease lease,
        MoveOutResidentCommand request,
        Guid userId,
        CancellationToken cancellationToken)
    {
        // Get other active lease parties
        var otherParties = await _dbContext.LeaseParties
            .Where(lp => lp.LeaseId == lease.Id &&
                        lp.Id != leaseParty.Id &&
                        lp.IsActive &&
                        !lp.MoveOutDate.HasValue)
            .ToListAsync(cancellationToken);

        if (request.EndLease)
        {
            // End the entire lease and set move-out for all parties
            if (!string.IsNullOrWhiteSpace(request.TerminationReason))
            {
                lease.Terminate(request.TerminationReason, userId);
            }
            else
            {
                lease.End(userId);
            }

            // Set move-out date for the primary
            leaseParty.SetMoveOutDate(request.MoveOutDate, userId);

            // Set move-out date for all other parties
            foreach (var party in otherParties)
            {
                party.SetMoveOutDate(request.MoveOutDate, userId);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }

        // Not ending lease - need to transfer primary
        if (!request.NewPrimaryLeasePartyId.HasValue)
        {
            if (!otherParties.Any())
            {
                return Result<bool>.Failure(
                    "Cannot move out the only primary resident without ending the lease. " +
                    "Either set EndLease=true or add another resident first.");
            }

            return Result<bool>.Failure(
                "Moving out the primary resident requires either ending the lease (EndLease=true) " +
                "or specifying a new primary resident (NewPrimaryLeasePartyId).");
        }

        // Validate the new primary
        var newPrimary = otherParties.FirstOrDefault(p => p.Id == request.NewPrimaryLeasePartyId.Value);
        if (newPrimary == null)
        {
            return Result<bool>.Failure(
                $"New primary lease party '{request.NewPrimaryLeasePartyId}' not found or is not an active party on this lease.");
        }

        // Only residents can become primary
        if (newPrimary.Role != LeasePartyRole.PrimaryResident && newPrimary.Role != LeasePartyRole.CoResident)
        {
            return Result<bool>.Failure(
                "The new primary must be a resident (PrimaryResident or CoResident role).");
        }

        // Transfer primary status
        leaseParty.SetPrimary(false, userId);
        leaseParty.SetMoveOutDate(request.MoveOutDate, userId);

        newPrimary.SetPrimary(true, userId);
        newPrimary.UpdateRole(LeasePartyRole.PrimaryResident, true, userId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
