using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.ResidentInvites.Dtos;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.ResidentInvites.Queries.ValidateInviteCode;

/// <summary>
/// Handler for validating a resident invite access code at the platform level.
/// This is a public endpoint that doesn't require authentication or tenant context.
/// </summary>
public sealed class ValidateInviteCodeQueryHandler
    : IRequestHandler<ValidateInviteCodeQuery, Result<ValidateInviteCodeResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ILogger<ValidateInviteCodeQueryHandler> _logger;

    public ValidateInviteCodeQueryHandler(
        IPlatformDbContext platformDbContext,
        ILogger<ValidateInviteCodeQueryHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    public async Task<Result<ValidateInviteCodeResponse>> Handle(
        ValidateInviteCodeQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.AccessCode))
        {
            return Result.Success(new ValidateInviteCodeResponse
            {
                IsValid = false,
                ErrorMessage = "Access code is required."
            });
        }

        var normalizedCode = request.AccessCode.ToUpperInvariant().Trim();

        // Find the invite code in the platform database
        var inviteCode = await _platformDbContext.ResidentInviteCodes
            .AsNoTracking()
            .FirstOrDefaultAsync(ric =>
                ric.AccessCode == normalizedCode &&
                ric.IsActive,
                cancellationToken);

        if (inviteCode == null)
        {
            _logger.LogInformation("Access code {Code} not found in platform database.", normalizedCode);
            return Result.Success(new ValidateInviteCodeResponse
            {
                IsValid = false,
                ErrorMessage = "Invalid access code. Please check and try again."
            });
        }

        // Check status
        if (inviteCode.Status == InviteCodeStatus.Used)
        {
            return Result.Success(new ValidateInviteCodeResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has already been accepted."
            });
        }

        if (inviteCode.Status == InviteCodeStatus.Cancelled)
        {
            return Result.Success(new ValidateInviteCodeResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has been cancelled."
            });
        }

        if (inviteCode.Status == InviteCodeStatus.Expired || DateTime.UtcNow > inviteCode.ExpiresAt)
        {
            return Result.Success(new ValidateInviteCodeResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has expired."
            });
        }

        // Verify the tenant is still active
        var tenant = await _platformDbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == inviteCode.TenantId, cancellationToken);

        if (tenant == null || tenant.Status != TenantStatus.Active || !tenant.IsActive)
        {
            return Result.Success(new ValidateInviteCodeResponse
            {
                IsValid = false,
                ErrorMessage = "The community is no longer active."
            });
        }

        _logger.LogInformation(
            "Access code {Code} validated successfully for tenant {TenantCode}, invite {InviteId}.",
            normalizedCode,
            inviteCode.TenantCode,
            inviteCode.InviteId);

        return Result.Success(new ValidateInviteCodeResponse
        {
            IsValid = true,
            TenantId = inviteCode.TenantId,
            TenantCode = inviteCode.TenantCode,
            TenantName = inviteCode.TenantName,
            InviteId = inviteCode.InviteId,
            Email = inviteCode.Email,
            PartyName = inviteCode.PartyName,
            UnitLabel = inviteCode.UnitLabel,
            Role = inviteCode.Role,
            ExpiresAt = inviteCode.ExpiresAt,
            InvitationToken = inviteCode.InvitationToken
        });
    }
}
