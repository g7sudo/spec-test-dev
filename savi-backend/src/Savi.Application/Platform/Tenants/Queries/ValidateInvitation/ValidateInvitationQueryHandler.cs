using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Interfaces;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Queries.ValidateInvitation;

/// <summary>
/// Handles public invitation validation.
/// </summary>
public sealed class ValidateInvitationQueryHandler
    : IRequestHandler<ValidateInvitationQuery, Result<ValidateInvitationResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ILogger<ValidateInvitationQueryHandler> _logger;

    public ValidateInvitationQueryHandler(
        IPlatformDbContext platformDbContext,
        ILogger<ValidateInvitationQueryHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    public async Task<Result<ValidateInvitationResponse>> Handle(
        ValidateInvitationQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return Result.Failure<ValidateInvitationResponse>("Invitation token is required.");
        }

        var invitation = await (
                from membership in _platformDbContext.UserTenantMemberships.AsNoTracking()
                join tenant in _platformDbContext.Tenants.AsNoTracking()
                    on membership.TenantId equals tenant.Id
                join user in _platformDbContext.PlatformUsers.AsNoTracking()
                    on membership.PlatformUserId equals user.Id
                where membership.InvitationToken == request.Token
                select new { membership, tenant, user })
            .FirstOrDefaultAsync(cancellationToken);

        if (invitation == null)
        {
            _logger.LogWarning("Invitation token {Token} not found.", request.Token);
            return Result.Failure<ValidateInvitationResponse>("Invitation not found.");
        }

        if (invitation.tenant.Status != TenantStatus.Active || !invitation.tenant.IsActive)
        {
            return Result.Failure<ValidateInvitationResponse>("Tenant is not active.");
        }

        if (invitation.membership.Status != MembershipStatus.Invited)
        {
            return Result.Failure<ValidateInvitationResponse>("Invitation has already been used.");
        }

        if (invitation.membership.IsInvitationExpired())
        {
            return Result.Failure<ValidateInvitationResponse>("Invitation has expired.");
        }

        return Result.Success(new ValidateInvitationResponse
        {
            TenantId = invitation.tenant.Id,
            TenantName = invitation.tenant.Name,
            TenantCode = invitation.tenant.Code ?? string.Empty,
            TenantCity = invitation.tenant.City,
            InviteeEmail = invitation.user.Email,
            TenantRoleCode = invitation.membership.TenantRoleCode ?? "COMMUNITY_ADMIN",
            InvitationExpiresAt = invitation.membership.InvitationExpiresAt!.Value
        });
    }
}

