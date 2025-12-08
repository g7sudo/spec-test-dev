using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.Domain.Tenant;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.ResidentInvites.Commands.AcceptResidentInvite;

/// <summary>
/// Handler for accepting a resident invite at the platform level.
/// Creates UserTenantMembership (Platform) and CommunityUser (Tenant).
/// </summary>
public sealed class AcceptResidentInviteCommandHandler
    : IRequestHandler<AcceptResidentInviteCommand, Result<AcceptResidentInviteResult>>
{
    private const string ResidentRoleCode = "RESIDENT";

    private readonly IPlatformDbContext _platformDbContext;
    private readonly ITenantDbContextFactory _tenantDbContextFactory;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AcceptResidentInviteCommandHandler> _logger;

    public AcceptResidentInviteCommandHandler(
        IPlatformDbContext platformDbContext,
        ITenantDbContextFactory tenantDbContextFactory,
        ICurrentUser currentUser,
        ILogger<AcceptResidentInviteCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _tenantDbContextFactory = tenantDbContextFactory;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<AcceptResidentInviteResult>> Handle(
        AcceptResidentInviteCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Processing accept invite for user {UserId}, access code {Code}",
            _currentUser.UserId,
            request.AccessCode);

        // 1. Find the ResidentInviteCode in Platform DB
        var normalizedCode = request.AccessCode.ToUpperInvariant().Trim();
        var inviteCode = await _platformDbContext.ResidentInviteCodes
            .FirstOrDefaultAsync(ric =>
                ric.AccessCode == normalizedCode &&
                ric.IsActive,
                cancellationToken);

        if (inviteCode == null)
        {
            return Result.Failure<AcceptResidentInviteResult>("Invalid access code.");
        }

        // 2. Validate invite is still valid
        if (inviteCode.Status == InviteCodeStatus.Used)
        {
            return Result.Failure<AcceptResidentInviteResult>("This invitation has already been accepted.");
        }

        if (inviteCode.Status == InviteCodeStatus.Cancelled)
        {
            return Result.Failure<AcceptResidentInviteResult>("This invitation has been cancelled.");
        }

        if (inviteCode.Status == InviteCodeStatus.Expired || DateTime.UtcNow > inviteCode.ExpiresAt)
        {
            return Result.Failure<AcceptResidentInviteResult>("This invitation has expired.");
        }

        // 3. Validate the invitation token
        if (!string.Equals(inviteCode.InvitationToken, request.InvitationToken, StringComparison.Ordinal))
        {
            return Result.Failure<AcceptResidentInviteResult>("Invalid invitation token.");
        }

        // 4. Check if user already has membership in this tenant
        var existingMembership = await _platformDbContext.UserTenantMemberships
            .FirstOrDefaultAsync(utm =>
                utm.PlatformUserId == _currentUser.UserId &&
                utm.TenantId == inviteCode.TenantId &&
                utm.IsActive,
                cancellationToken);

        if (existingMembership != null && existingMembership.Status == MembershipStatus.Active)
        {
            return Result.Failure<AcceptResidentInviteResult>(
                "You are already a member of this community.");
        }

        // 5. Get tenant context factory and create tenant DB context
        var tenantDbContextObj = await _tenantDbContextFactory.CreateAsync(inviteCode.TenantId, cancellationToken);
        if (tenantDbContextObj is not ITenantDbContext tenantDbContext)
        {
            _logger.LogError("Failed to create tenant DB context for tenant {TenantId}", inviteCode.TenantId);
            return Result.Failure<AcceptResidentInviteResult>("Failed to access community database.");
        }

        // 6. Get the ResidentInvite from Tenant DB to get PartyId
        var residentInvite = await tenantDbContext.ResidentInvites
            .FirstOrDefaultAsync(ri => ri.Id == inviteCode.InviteId && ri.IsActive, cancellationToken);

        if (residentInvite == null)
        {
            return Result.Failure<AcceptResidentInviteResult>("Invite not found in community database.");
        }

        // Verify invite is still pending in tenant DB
        if (!residentInvite.IsValid)
        {
            return Result.Failure<AcceptResidentInviteResult>("This invitation is no longer valid.");
        }

        // 7. Check if CommunityUser already exists for this platform user
        var existingCommunityUser = await tenantDbContext.CommunityUsers
            .FirstOrDefaultAsync(cu =>
                cu.PlatformUserId == _currentUser.UserId &&
                cu.IsActive,
                cancellationToken);

        Guid communityUserId;
        if (existingCommunityUser != null)
        {
            communityUserId = existingCommunityUser.Id;
            _logger.LogInformation(
                "CommunityUser already exists: {CommunityUserId} for PlatformUser {PlatformUserId}",
                communityUserId,
                _currentUser.UserId);
        }
        else
        {
            // 8. Create CommunityUser linked to the Party from the invite
            var communityUser = CommunityUser.Create(
                partyId: residentInvite.PartyId,
                platformUserId: _currentUser.UserId,
                preferredName: null,
                timezone: null,
                locale: null,
                createdBy: null);

            tenantDbContext.Add(communityUser);
            communityUserId = communityUser.Id;

            _logger.LogInformation(
                "Created CommunityUser {CommunityUserId} for Party {PartyId}, PlatformUser {PlatformUserId}",
                communityUserId,
                residentInvite.PartyId,
                _currentUser.UserId);
        }

        // 9. Assign RESIDENT role
        var roleGroup = await tenantDbContext.RoleGroups
            .FirstOrDefaultAsync(rg => rg.Code == ResidentRoleCode && rg.IsActive, cancellationToken);

        if (roleGroup != null)
        {
            var existingRoleAssignment = await tenantDbContext.CommunityUserRoleGroups
                .AnyAsync(curg =>
                    curg.CommunityUserId == communityUserId &&
                    curg.RoleGroupId == roleGroup.Id &&
                    curg.IsActive,
                    cancellationToken);

            if (!existingRoleAssignment)
            {
                var roleAssignment = CommunityUserRoleGroup.Create(
                    communityUserId,
                    roleGroup.Id,
                    isPrimary: true);

                tenantDbContext.Add(roleAssignment);

                _logger.LogInformation(
                    "Assigned RESIDENT role to CommunityUser {CommunityUserId}",
                    communityUserId);
            }
        }
        else
        {
            _logger.LogWarning(
                "RESIDENT role group not found in tenant {TenantId}. User will have no roles.",
                inviteCode.TenantId);
        }

        // 10. Link LeaseParty to CommunityUser
        var leaseParty = await tenantDbContext.LeaseParties
            .FirstOrDefaultAsync(lp =>
                lp.LeaseId == residentInvite.LeaseId &&
                lp.PartyId == residentInvite.PartyId &&
                lp.IsActive,
                cancellationToken);

        if (leaseParty != null)
        {
            leaseParty.LinkToCommunityUser(communityUserId, communityUserId);
            _logger.LogInformation(
                "Linked LeaseParty {LeasePartyId} to CommunityUser {CommunityUserId}",
                leaseParty.Id,
                communityUserId);
        }
        else
        {
            _logger.LogWarning(
                "LeaseParty not found for LeaseId {LeaseId}, PartyId {PartyId}. User won't be linked to lease.",
                residentInvite.LeaseId,
                residentInvite.PartyId);
        }

        // 11. Mark ResidentInvite as accepted in Tenant DB
        residentInvite.Accept(communityUserId);

        // 12. Save Tenant DB changes
        await tenantDbContext.SaveChangesAsync(cancellationToken);

        // 13. Create or update UserTenantMembership in Platform DB
        if (existingMembership != null)
        {
            existingMembership.Accept(_currentUser.UserId);
        }
        else
        {
            var membership = UserTenantMembership.CreateActive(
                _currentUser.UserId,
                inviteCode.TenantId,
                ResidentRoleCode,
                _currentUser.UserId);

            _platformDbContext.Add(membership);
        }

        // 14. Mark ResidentInviteCode as used in Platform DB
        inviteCode.MarkAsUsed();

        // 15. Save Platform DB changes
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully accepted invite for user {UserId} in tenant {TenantCode}. " +
            "CommunityUserId: {CommunityUserId}, Membership created.",
            _currentUser.UserId,
            inviteCode.TenantCode,
            communityUserId);

        return Result.Success(new AcceptResidentInviteResult
        {
            PlatformUserId = _currentUser.UserId,
            CommunityUserId = communityUserId,
            TenantId = inviteCode.TenantId,
            TenantCode = inviteCode.TenantCode,
            TenantName = inviteCode.TenantName,
            LeaseId = residentInvite.LeaseId,
            UnitLabel = inviteCode.UnitLabel,
            Role = inviteCode.Role
        });
    }
}
