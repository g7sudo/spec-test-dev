using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.ResidentInvites.Commands.AcceptResidentInvite;

/// <summary>
/// Handler for accepting a resident invite.
/// </summary>
public class AcceptResidentInviteCommandHandler
    : IRequestHandler<AcceptResidentInviteCommand, Result<AcceptResidentInviteResult>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AcceptResidentInviteCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<AcceptResidentInviteResult>> Handle(
        AcceptResidentInviteCommand request,
        CancellationToken cancellationToken)
    {
        // Must have a tenant user (created during Firebase auth flow)
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<AcceptResidentInviteResult>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Get the invite
        var invite = await _dbContext.ResidentInvites
            .FirstOrDefaultAsync(ri => ri.Id == request.InviteId && ri.IsActive, cancellationToken);

        if (invite == null)
        {
            return Result<AcceptResidentInviteResult>.Failure("Invite not found.");
        }

        // Validate token
        if (!invite.ValidateToken(request.InvitationToken))
        {
            return Result<AcceptResidentInviteResult>.Failure("Invalid invitation token.");
        }

        // Check if invite is still valid
        if (!invite.IsValid)
        {
            if (invite.Status == ResidentInviteStatus.Accepted)
            {
                return Result<AcceptResidentInviteResult>.Failure("This invite has already been accepted.");
            }
            if (invite.Status == ResidentInviteStatus.Cancelled)
            {
                return Result<AcceptResidentInviteResult>.Failure("This invite has been cancelled.");
            }
            if (invite.IsExpired)
            {
                return Result<AcceptResidentInviteResult>.Failure("This invite has expired.");
            }
            return Result<AcceptResidentInviteResult>.Failure("This invite is no longer valid.");
        }

        // Verify lease is still active
        var lease = await _dbContext.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == invite.LeaseId && l.IsActive, cancellationToken);

        if (lease == null || (lease.Status != LeaseStatus.Active && lease.Status != LeaseStatus.Draft))
        {
            return Result<AcceptResidentInviteResult>.Failure("The lease is no longer active.");
        }

        // Get unit info for result
        var unitInfo = await _dbContext.Units
            .AsNoTracking()
            .Where(u => u.Id == lease.UnitId)
            .Select(u => new
            {
                u.UnitNumber,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == u.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);

        var unitLabel = unitInfo != null
            ? $"{unitInfo.BlockName}-{unitInfo.UnitNumber}".Trim('-')
            : "Unknown Unit";

        // Check if party is already on the lease (shouldn't happen but safety check)
        var existingLeaseParty = await _dbContext.LeaseParties
            .FirstOrDefaultAsync(lp =>
                lp.LeaseId == invite.LeaseId &&
                lp.PartyId == invite.PartyId &&
                lp.IsActive,
                cancellationToken);

        Guid leasePartyId;
        if (existingLeaseParty != null)
        {
            // Link to community user if not already linked
            if (!existingLeaseParty.HasAppAccount)
            {
                existingLeaseParty.LinkToCommunityUser(_currentUser.TenantUserId.Value, _currentUser.TenantUserId.Value);
            }
            leasePartyId = existingLeaseParty.Id;
        }
        else
        {
            // Determine if this should be primary (first PrimaryResident on the lease)
            var isPrimary = invite.Role == LeasePartyRole.PrimaryResident;
            if (isPrimary)
            {
                var existingPrimary = await _dbContext.LeaseParties
                    .AnyAsync(lp =>
                        lp.LeaseId == invite.LeaseId &&
                        lp.IsActive &&
                        lp.IsPrimary,
                        cancellationToken);
                isPrimary = !existingPrimary; // Only primary if no existing primary
            }

            // Create lease party
            var leaseParty = LeaseParty.Create(
                invite.LeaseId,
                invite.PartyId,
                invite.Role,
                isPrimary,
                DateOnly.FromDateTime(DateTime.UtcNow),
                _currentUser.TenantUserId.Value);

            leaseParty.LinkToCommunityUser(_currentUser.TenantUserId.Value, _currentUser.TenantUserId.Value);
            _dbContext.Add(leaseParty);
            leasePartyId = leaseParty.Id;
        }

        // Accept the invite
        invite.Accept(_currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<AcceptResidentInviteResult>.Success(new AcceptResidentInviteResult
        {
            CommunityUserId = _currentUser.TenantUserId.Value,
            LeasePartyId = leasePartyId,
            LeaseId = invite.LeaseId,
            UnitLabel = unitLabel
        });
    }
}
