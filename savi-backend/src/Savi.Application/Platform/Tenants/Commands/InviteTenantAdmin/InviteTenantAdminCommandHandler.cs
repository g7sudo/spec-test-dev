using System.Security.Cryptography;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Tenants.Commands.InviteTenantAdmin;

/// <summary>
/// Handles platform-side tenant admin invitations.
/// </summary>
public sealed class InviteTenantAdminCommandHandler
    : IRequestHandler<InviteTenantAdminCommand, Result<InviteTenantAdminResponse>>
{
    private const string InvitationTemplateName = "TenantAdminInvitation";

    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IEmailService _emailService;
    private readonly ILogger<InviteTenantAdminCommandHandler> _logger;
    private readonly TenantInvitationOptions _options;

    public InviteTenantAdminCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        IEmailService emailService,
        IOptions<TenantInvitationOptions> options,
        ILogger<InviteTenantAdminCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _emailService = emailService;
        _logger = logger;
        _options = options.Value ?? new TenantInvitationOptions();
    }

    public async Task<Result<InviteTenantAdminResponse>> Handle(
        InviteTenantAdminCommand command,
        CancellationToken cancellationToken)
    {
        if (command.TenantId == Guid.Empty)
        {
            return Result.Failure<InviteTenantAdminResponse>("TenantId is required.");
        }

        var normalizedEmail = command.Request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return Result.Failure<InviteTenantAdminResponse>("Invite email is required.");
        }

        var tenant = await _platformDbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == command.TenantId && t.IsActive, cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<InviteTenantAdminResponse>("Tenant not found or inactive.");
        }

        if (tenant.Status != TenantStatus.Active)
        {
            return Result.Failure<InviteTenantAdminResponse>($"Tenant is {tenant.Status} and cannot accept invites.");
        }

        var platformUser = await _platformDbContext.PlatformUsers
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (platformUser == null)
        {
            platformUser = PlatformUser.Create(
                email: normalizedEmail,
                fullName: command.Request.FullName,
                createdBy: _currentUser.UserId);

            _platformDbContext.Add(platformUser);
        }
        else if (!string.IsNullOrWhiteSpace(command.Request.FullName) &&
                 string.IsNullOrWhiteSpace(platformUser.FullName))
        {
            platformUser.UpdateProfile(command.Request.FullName, platformUser.PhoneNumber, _currentUser.UserId);
        }

        var membership = await _platformDbContext.UserTenantMemberships
            .FirstOrDefaultAsync(
                m => m.TenantId == tenant.Id && m.PlatformUserId == platformUser.Id,
                cancellationToken);

        var expiryDays = _options.ExpiryDays > 0 ? _options.ExpiryDays : 7;
        var roleCode = string.IsNullOrWhiteSpace(_options.DefaultRoleCode)
            ? "COMMUNITY_ADMIN"
            : _options.DefaultRoleCode.Trim().ToUpperInvariant();
        var token = GenerateSecureToken();

        if (membership == null)
        {
            membership = UserTenantMembership.CreateInvited(
                platformUser.Id,
                tenant.Id,
                token,
                roleCode,
                expiryDays,
                invitedByUserId: _currentUser.UserId,
                createdBy: _currentUser.UserId);

            _platformDbContext.Add(membership);
        }
        else if (membership.Status == MembershipStatus.Active)
        {
            return Result.Failure<InviteTenantAdminResponse>("User is already active inside this tenant.");
        }
        else
        {
            membership.UpdateTenantRoleCode(roleCode, _currentUser.UserId);
            membership.ReissueInvitation(
                token,
                expiryDays,
                invitedByUserId: _currentUser.UserId,
                updatedBy: _currentUser.UserId);
        }

        var audit = PlatformAuditLog.Create(
            PlatformAuditActions.MembershipInvited,
            nameof(UserTenantMembership),
            membership.Id.ToString(),
            platformUserId: _currentUser.UserId,
            tenantId: tenant.Id,
            newValues: Serialize(new
            {
                membership.PlatformUserId,
                membership.TenantId,
                membership.Status,
                membership.InvitationExpiresAt,
                membership.TenantRoleCode
            }));

        _platformDbContext.Add(audit);

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        var invitationUrl = BuildInvitationUrl(token);

        if (_options.LogInvitationLink)
        {
            _logger.LogInformation(
                "Generated COMMUNITY_ADMIN invite for tenant {TenantCode} ({TenantId}) -> {Email}. Url: {InvitationUrl}",
                tenant.Code,
                tenant.Id,
                normalizedEmail,
                invitationUrl ?? "[hidden]");
        }

        // Send invitation email
        if (!string.IsNullOrWhiteSpace(invitationUrl))
        {
            var recipientName = command.Request.FullName ?? normalizedEmail.Split('@')[0];
            var templateData = new Dictionary<string, string>
            {
                ["RecipientName"] = recipientName,
                ["TenantName"] = tenant.Name,
                ["InvitationUrl"] = invitationUrl,
                ["ExpiryDays"] = expiryDays.ToString()
            };

            var emailResult = await _emailService.SendTemplateAsync(
                InvitationTemplateName,
                normalizedEmail,
                recipientName,
                templateData,
                cancellationToken);

            if (!emailResult.Success)
            {
                _logger.LogWarning(
                    "Failed to send invitation email to {Email}: {Error}",
                    normalizedEmail,
                    emailResult.Error);
                // Note: We don't fail the whole operation if email fails
                // The invitation is still created and can be resent
            }
            else
            {
                _logger.LogInformation(
                    "Invitation email sent to {Email}. MessageId: {MessageId}",
                    normalizedEmail,
                    emailResult.MessageId);
            }
        }

        return Result.Success(new InviteTenantAdminResponse
        {
            MembershipId = membership.Id,
            TenantId = tenant.Id,
            TenantName = tenant.Name,
            TenantCode = tenant.Code ?? string.Empty,
            InviteeEmail = normalizedEmail,
            TenantRoleCode = roleCode,
            InvitationExpiresAt = membership.InvitationExpiresAt ?? DateTime.UtcNow.AddDays(expiryDays),
            InvitationToken = _options.ExposeInvitationDetails ? token : null,
            InvitationUrl = _options.ExposeInvitationDetails ? invitationUrl : null
        });
    }

    private static string GenerateSecureToken()
    {
        Span<byte> buffer = stackalloc byte[32];
        RandomNumberGenerator.Fill(buffer);
        return Convert.ToHexString(buffer);
    }

    private string? BuildInvitationUrl(string token)
    {
        if (string.IsNullOrWhiteSpace(_options.InvitationBaseUrl))
        {
            return null;
        }

        return _options.InvitationBaseUrl.Contains("{token}", StringComparison.OrdinalIgnoreCase)
            ? _options.InvitationBaseUrl.Replace("{token}", token, StringComparison.OrdinalIgnoreCase)
            : $"{_options.InvitationBaseUrl.TrimEnd('/')}/{token}";
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

