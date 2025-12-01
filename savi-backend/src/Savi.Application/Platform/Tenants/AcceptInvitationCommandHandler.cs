using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Tenants;

/// <summary>
/// Handles accepting invitations (public endpoint, requires Firebase auth).
/// </summary>
public sealed class AcceptInvitationCommandHandler
    : IRequestHandler<AcceptInvitationCommand, Result<AcceptInvitationResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ITenantAdminOnboardingService _tenantAdminOnboardingService;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AcceptInvitationCommandHandler> _logger;

    public AcceptInvitationCommandHandler(
        IPlatformDbContext platformDbContext,
        ITenantAdminOnboardingService tenantAdminOnboardingService,
        ICurrentUser currentUser,
        ILogger<AcceptInvitationCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _tenantAdminOnboardingService = tenantAdminOnboardingService;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<AcceptInvitationResponse>> Handle(
        AcceptInvitationCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Request.InvitationToken))
        {
            return Result.Failure<AcceptInvitationResponse>("Invitation token is required.");
        }

        var invitation = await (
                from membership in _platformDbContext.UserTenantMemberships
                join tenant in _platformDbContext.Tenants
                    on membership.TenantId equals tenant.Id
                join user in _platformDbContext.PlatformUsers
                    on membership.PlatformUserId equals user.Id
                where membership.InvitationToken == command.Request.InvitationToken
                select new { membership, tenant, user })
            .FirstOrDefaultAsync(cancellationToken);

        if (invitation == null)
        {
            return Result.Failure<AcceptInvitationResponse>("Invitation not found.");
        }

        if (!string.Equals(invitation.user.Email, _currentUser.Email, StringComparison.OrdinalIgnoreCase))
        {
            return Result.Failure<AcceptInvitationResponse>("Please sign in using the email that was invited.");
        }

        if (invitation.membership.PlatformUserId != _currentUser.UserId)
        {
            return Result.Failure<AcceptInvitationResponse>("Invitation is linked to a different user.");
        }

        if (invitation.membership.Status != MembershipStatus.Invited)
        {
            return Result.Failure<AcceptInvitationResponse>("Invitation has already been used.");
        }

        if (invitation.membership.IsInvitationExpired())
        {
            return Result.Failure<AcceptInvitationResponse>("Invitation has expired.");
        }

        if (invitation.tenant.Status != TenantStatus.Active || !invitation.tenant.IsActive)
        {
            return Result.Failure<AcceptInvitationResponse>("Tenant is not active.");
        }

        invitation.membership.Accept(_currentUser.UserId);

        await _tenantAdminOnboardingService.EnsureCommunityAdminAsync(
            invitation.tenant.Id,
            _currentUser.UserId,
            invitation.membership.TenantRoleCode ?? "COMMUNITY_ADMIN",
            invitation.user.FullName,
            cancellationToken);

        var audit = PlatformAuditLog.Create(
            PlatformAuditActions.MembershipAccepted,
            nameof(UserTenantMembership),
            invitation.membership.Id.ToString(),
            platformUserId: _currentUser.UserId,
            tenantId: invitation.tenant.Id,
            newValues: Serialize(new
            {
                invitation.membership.PlatformUserId,
                invitation.membership.TenantId,
                invitation.membership.Status,
                invitation.membership.JoinedAt
            }));

        _platformDbContext.Add(audit);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} accepted invite for tenant {TenantId}.",
            _currentUser.UserId,
            invitation.tenant.Id);

        return Result.Success(new AcceptInvitationResponse
        {
            TenantId = invitation.tenant.Id,
            TenantName = invitation.tenant.Name,
            TenantCode = invitation.tenant.Code ?? string.Empty,
            TenantRoleCode = invitation.membership.TenantRoleCode ?? "COMMUNITY_ADMIN",
            RequiresFirstTimeSetup = true
        });
    }

    private static string Serialize(object payload) =>
        JsonSerializer.Serialize(
            payload,
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            });
}

