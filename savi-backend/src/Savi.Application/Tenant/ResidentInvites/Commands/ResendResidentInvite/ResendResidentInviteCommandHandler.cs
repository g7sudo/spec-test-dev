using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Domain.Platform;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

using ResidentInviteEntity = Savi.Domain.Tenant.ResidentInvite;

namespace Savi.Application.Tenant.ResidentInvites.Commands.ResendResidentInvite;

/// <summary>
/// Handler for resending a resident invite.
/// </summary>
public class ResendResidentInviteCommandHandler
    : IRequestHandler<ResendResidentInviteCommand, Result<CreateResidentInviteResult>>
{
    private const string ResidentInvitationTemplate = "ResidentInvitation";

    private readonly ITenantDbContext _dbContext;
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ITenantContext _tenantContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<ResendResidentInviteCommandHandler> _logger;
    private readonly ResidentInvitationOptions _options;

    public ResendResidentInviteCommandHandler(
        ITenantDbContext dbContext,
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ITenantContext tenantContext,
        IEmailService emailService,
        IOptions<ResidentInvitationOptions> options,
        ILogger<ResendResidentInviteCommandHandler> logger)
    {
        _dbContext = dbContext;
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _tenantContext = tenantContext;
        _emailService = emailService;
        _logger = logger;
        _options = options.Value ?? new ResidentInvitationOptions();
    }

    public async Task<Result<CreateResidentInviteResult>> Handle(
        ResendResidentInviteCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<CreateResidentInviteResult>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Get the original invite
        var originalInvite = await _dbContext.ResidentInvites
            .FirstOrDefaultAsync(ri => ri.Id == request.InviteId && ri.IsActive, cancellationToken);

        if (originalInvite == null)
        {
            return Result<CreateResidentInviteResult>.Failure("Invite not found.");
        }

        // Check if invite can be resent (only pending or expired)
        if (originalInvite.Status == ResidentInviteStatus.Accepted)
        {
            return Result<CreateResidentInviteResult>.Failure(
                "Cannot resend an invite that has already been accepted.");
        }

        // Check if party already has app access (CommunityUser linked)
        var leasePartyWithAppAccess = await _dbContext.LeaseParties
            .AsNoTracking()
            .AnyAsync(lp =>
                lp.LeaseId == originalInvite.LeaseId &&
                lp.PartyId == originalInvite.PartyId &&
                lp.IsActive &&
                lp.CommunityUserId != null,
                cancellationToken);

        if (leasePartyWithAppAccess)
        {
            return Result<CreateResidentInviteResult>.Failure("This resident already has app access.");
        }

        // Get lease details
        var lease = await _dbContext.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == originalInvite.LeaseId && l.IsActive, cancellationToken);

        if (lease == null || (lease.Status != LeaseStatus.Active && lease.Status != LeaseStatus.Draft))
        {
            return Result<CreateResidentInviteResult>.Failure("The lease is no longer active.");
        }

        // Get party details
        var party = await _dbContext.Parties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == originalInvite.PartyId && p.IsActive, cancellationToken);

        if (party == null)
        {
            return Result<CreateResidentInviteResult>.Failure("Party not found.");
        }

        // Get unit info for email
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
            : "Your Unit";

        // Cancel the old invite if it's still pending
        if (originalInvite.Status == ResidentInviteStatus.Pending)
        {
            originalInvite.Cancel(_currentUser.TenantUserId.Value);

            // Also cancel the old platform invite code
            var oldPlatformCode = await _platformDbContext.ResidentInviteCodes
                .FirstOrDefaultAsync(ric =>
                    ric.InviteId == originalInvite.Id &&
                    ric.Status == InviteCodeStatus.Active,
                    cancellationToken);

            if (oldPlatformCode != null)
            {
                oldPlatformCode.Cancel();
            }
        }

        // Create a new invite
        var newInvite = ResidentInviteEntity.Create(
            originalInvite.LeaseId,
            originalInvite.PartyId,
            originalInvite.Role,
            originalInvite.Email,
            request.ExpirationDays,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(newInvite);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Create platform-level access code record for cross-tenant lookup
        var platformInviteCode = ResidentInviteCode.Create(
            newInvite.AccessCode,
            _tenantContext.TenantId!.Value,
            _tenantContext.TenantCode ?? string.Empty,
            _tenantContext.TenantName ?? "Community",
            newInvite.Id,
            newInvite.InvitationToken,
            newInvite.Email,
            party.PartyName,
            unitLabel,
            originalInvite.Role.ToString(),
            newInvite.ExpiresAt);

        _platformDbContext.Add(platformInviteCode);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created platform invite code {AccessCode} for tenant {TenantCode}, invite {InviteId} (resend)",
            newInvite.AccessCode,
            _tenantContext.TenantCode,
            newInvite.Id);

        // Build invitation URL
        var invitationUrl = BuildInvitationUrl(newInvite.Id, newInvite.InvitationToken);

        if (_options.LogInvitationLink)
        {
            _logger.LogInformation(
                "Resent resident invite for lease {LeaseId}, party {PartyId}. New InviteId: {InviteId}. Url: {InvitationUrl}",
                lease.Id,
                party.Id,
                newInvite.Id,
                invitationUrl ?? "[hidden]");
        }

        // Send invitation email
        var emailSent = false;
        if (!string.IsNullOrWhiteSpace(invitationUrl))
        {
            var roleDisplay = originalInvite.Role == LeasePartyRole.PrimaryResident
                ? "Primary Resident"
                : "Co-Resident";

            var templateData = new Dictionary<string, string>
            {
                ["RecipientName"] = party.PartyName ?? originalInvite.Email.Split('@')[0],
                ["CommunityName"] = _tenantContext.TenantName ?? "Community",
                ["UnitLabel"] = unitLabel,
                ["Role"] = roleDisplay,
                ["InvitationUrl"] = invitationUrl,
                ["AccessCode"] = newInvite.AccessCode,
                ["ExpiryDays"] = request.ExpirationDays.ToString()
            };

            var emailResult = await _emailService.SendTemplateAsync(
                ResidentInvitationTemplate,
                originalInvite.Email,
                party.PartyName,
                templateData,
                cancellationToken);

            if (!emailResult.Success)
            {
                _logger.LogWarning(
                    "Failed to send resident invitation email to {Email}: {Error}",
                    originalInvite.Email,
                    emailResult.Error);
            }
            else
            {
                emailSent = true;
                _logger.LogInformation(
                    "Resident invitation email resent to {Email}. MessageId: {MessageId}",
                    originalInvite.Email,
                    emailResult.MessageId);
            }
        }

        return Result<CreateResidentInviteResult>.Success(new CreateResidentInviteResult
        {
            InviteId = newInvite.Id,
            LeaseId = newInvite.LeaseId,
            PartyId = newInvite.PartyId,
            PartyName = party.PartyName ?? string.Empty,
            Email = newInvite.Email,
            Role = newInvite.Role,
            ExpiresAt = newInvite.ExpiresAt,
            EmailSent = emailSent,
            InvitationToken = _options.ExposeInvitationDetails ? newInvite.InvitationToken : null,
            InvitationUrl = _options.ExposeInvitationDetails ? invitationUrl : null,
            AccessCode = _options.ExposeInvitationDetails ? newInvite.AccessCode : null
        });
    }

    private string? BuildInvitationUrl(Guid inviteId, string token)
    {
        if (string.IsNullOrWhiteSpace(_options.InvitationBaseUrl))
        {
            return null;
        }

        var url = _options.InvitationBaseUrl
            .Replace("{tenantSlug}", _tenantContext.TenantCode ?? "", StringComparison.OrdinalIgnoreCase)
            .Replace("{inviteId}", inviteId.ToString(), StringComparison.OrdinalIgnoreCase)
            .Replace("{token}", token, StringComparison.OrdinalIgnoreCase);

        return url;
    }
}
