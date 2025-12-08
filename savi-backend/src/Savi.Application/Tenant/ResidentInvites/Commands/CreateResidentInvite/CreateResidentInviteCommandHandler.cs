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

namespace Savi.Application.Tenant.ResidentInvites.Commands.CreateResidentInvite;

/// <summary>
/// Handler for creating a resident invite.
/// </summary>
public class CreateResidentInviteCommandHandler
    : IRequestHandler<CreateResidentInviteCommand, Result<CreateResidentInviteResult>>
{
    private const string ResidentInvitationTemplate = "ResidentInvitation";

    private readonly ITenantDbContext _dbContext;
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ITenantContext _tenantContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<CreateResidentInviteCommandHandler> _logger;
    private readonly ResidentInvitationOptions _options;

    public CreateResidentInviteCommandHandler(
        ITenantDbContext dbContext,
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ITenantContext tenantContext,
        IEmailService emailService,
        IOptions<ResidentInvitationOptions> options,
        ILogger<CreateResidentInviteCommandHandler> logger)
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
        CreateResidentInviteCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<CreateResidentInviteResult>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Verify lease exists and is active
        var lease = await _dbContext.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == request.LeaseId && l.IsActive, cancellationToken);

        if (lease == null)
        {
            return Result<CreateResidentInviteResult>.Failure($"Lease with ID '{request.LeaseId}' not found.");
        }

        if (lease.Status != LeaseStatus.Active && lease.Status != LeaseStatus.Draft)
        {
            return Result<CreateResidentInviteResult>.Failure("Cannot create invites for ended or terminated leases.");
        }

        // Get party details
        var party = await _dbContext.Parties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PartyId && p.IsActive, cancellationToken);

        if (party == null)
        {
            return Result<CreateResidentInviteResult>.Failure($"Party with ID '{request.PartyId}' not found.");
        }

        // Check for existing pending invite for this party and lease
        var existingInvite = await _dbContext.ResidentInvites
            .AsNoTracking()
            .AnyAsync(ri =>
                ri.LeaseId == request.LeaseId &&
                ri.PartyId == request.PartyId &&
                ri.IsActive &&
                ri.Status == ResidentInviteStatus.Pending,
                cancellationToken);

        if (existingInvite)
        {
            return Result<CreateResidentInviteResult>.Failure(
                "A pending invite already exists for this party on this lease.");
        }

        // Check if party is already on the lease
        var existingLeaseParty = await _dbContext.LeaseParties
            .AsNoTracking()
            .FirstOrDefaultAsync(lp =>
                lp.LeaseId == request.LeaseId &&
                lp.PartyId == request.PartyId &&
                lp.IsActive,
                cancellationToken);

        // If party is already on lease, check if they already have app access
        if (existingLeaseParty != null && existingLeaseParty.CommunityUserId.HasValue)
        {
            return Result<CreateResidentInviteResult>.Failure(
                "This party is already on the lease and has app access.");
        }

        // Validate role - only PrimaryResident or CoResident can be invited
        if (request.Role != LeasePartyRole.PrimaryResident && request.Role != LeasePartyRole.CoResident)
        {
            return Result<CreateResidentInviteResult>.Failure("Only PrimaryResident or CoResident roles can be invited.");
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

        // Create the invite
        var invite = ResidentInvite.Create(
            request.LeaseId,
            request.PartyId,
            request.Role,
            request.Email,
            request.ExpirationDays,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(invite);

        // Check if party already has this email as a contact
        var existingEmailContact = await _dbContext.PartyContacts
            .FirstOrDefaultAsync(pc =>
                pc.PartyId == request.PartyId &&
                pc.ContactType == PartyContactType.Email &&
                pc.Value.ToLower() == request.Email.ToLower() &&
                pc.IsActive,
                cancellationToken);

        if (existingEmailContact == null)
        {
            // Check if party has any primary email contact
            var hasPrimaryEmail = await _dbContext.PartyContacts
                .AnyAsync(pc =>
                    pc.PartyId == request.PartyId &&
                    pc.ContactType == PartyContactType.Email &&
                    pc.IsPrimary &&
                    pc.IsActive,
                    cancellationToken);

            // Create new email contact for the party
            var emailContact = PartyContact.Create(
                request.PartyId,
                PartyContactType.Email,
                request.Email,
                isPrimary: !hasPrimaryEmail, // Make primary if no existing primary email
                _currentUser.TenantUserId);

            _dbContext.Add(emailContact);

            _logger.LogInformation(
                "Created email contact for party {PartyId}: {Email} (IsPrimary: {IsPrimary})",
                request.PartyId,
                request.Email,
                !hasPrimaryEmail);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Create platform-level access code record for cross-tenant lookup
        var platformInviteCode = ResidentInviteCode.Create(
            invite.AccessCode,
            _tenantContext.TenantId!.Value,
            _tenantContext.TenantCode ?? string.Empty,
            _tenantContext.TenantName ?? "Community",
            invite.Id,
            invite.InvitationToken,
            invite.Email,
            party.PartyName,
            unitLabel,
            request.Role.ToString(),
            invite.ExpiresAt);

        _platformDbContext.Add(platformInviteCode);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created platform invite code {AccessCode} for tenant {TenantCode}, invite {InviteId}",
            invite.AccessCode,
            _tenantContext.TenantCode,
            invite.Id);

        // Build invitation URL
        var invitationUrl = BuildInvitationUrl(invite.Id, invite.InvitationToken);

        if (_options.LogInvitationLink)
        {
            _logger.LogInformation(
                "Generated resident invite for lease {LeaseId}, party {PartyId}. Url: {InvitationUrl}",
                lease.Id,
                party.Id,
                invitationUrl ?? "[hidden]");
        }

        // Send invitation email
        var emailSent = false;
        if (!string.IsNullOrWhiteSpace(invitationUrl))
        {
            var roleDisplay = request.Role == LeasePartyRole.PrimaryResident
                ? "Primary Resident"
                : "Co-Resident";

            var templateData = new Dictionary<string, string>
            {
                ["RecipientName"] = party.PartyName ?? request.Email.Split('@')[0],
                ["CommunityName"] = _tenantContext.TenantName ?? "Community",
                ["UnitLabel"] = unitLabel,
                ["Role"] = roleDisplay,
                ["InvitationUrl"] = invitationUrl,
                ["AccessCode"] = invite.AccessCode,
                ["ExpiryDays"] = request.ExpirationDays.ToString()
            };

            var emailResult = await _emailService.SendTemplateAsync(
                ResidentInvitationTemplate,
                request.Email,
                party.PartyName,
                templateData,
                cancellationToken);

            if (!emailResult.Success)
            {
                _logger.LogWarning(
                    "Failed to send resident invitation email to {Email}: {Error}",
                    request.Email,
                    emailResult.Error);
            }
            else
            {
                emailSent = true;
                _logger.LogInformation(
                    "Resident invitation email sent to {Email}. MessageId: {MessageId}",
                    request.Email,
                    emailResult.MessageId);
            }
        }

        return Result<CreateResidentInviteResult>.Success(new CreateResidentInviteResult
        {
            InviteId = invite.Id,
            LeaseId = invite.LeaseId,
            PartyId = invite.PartyId,
            PartyName = party.PartyName ?? string.Empty,
            Email = invite.Email,
            Role = invite.Role,
            ExpiresAt = invite.ExpiresAt,
            EmailSent = emailSent,
            InvitationToken = _options.ExposeInvitationDetails ? invite.InvitationToken : null,
            InvitationUrl = _options.ExposeInvitationDetails ? invitationUrl : null,
            AccessCode = _options.ExposeInvitationDetails ? invite.AccessCode : null
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
