using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Queries.ValidateResidentInvite;

/// <summary>
/// Handler for ValidateResidentInviteQuery.
/// </summary>
public class ValidateResidentInviteQueryHandler
    : IRequestHandler<ValidateResidentInviteQuery, Result<ResidentInviteValidationDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public ValidateResidentInviteQueryHandler(
        ITenantDbContext dbContext,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    public async Task<Result<ResidentInviteValidationDto>> Handle(
        ValidateResidentInviteQuery request,
        CancellationToken cancellationToken)
    {
        // Get the invite
        var invite = await _dbContext.ResidentInvites
            .AsNoTracking()
            .FirstOrDefaultAsync(ri => ri.Id == request.InviteId && ri.IsActive, cancellationToken);

        if (invite == null)
        {
            return Result<ResidentInviteValidationDto>.Success(new ResidentInviteValidationDto
            {
                IsValid = false,
                ErrorMessage = "Invite not found or has been deactivated."
            });
        }

        // Validate token
        if (!invite.ValidateToken(request.Token))
        {
            return Result<ResidentInviteValidationDto>.Success(new ResidentInviteValidationDto
            {
                IsValid = false,
                ErrorMessage = "Invalid invitation token."
            });
        }

        // Check status
        if (invite.Status == ResidentInviteStatus.Accepted)
        {
            return Result<ResidentInviteValidationDto>.Success(new ResidentInviteValidationDto
            {
                IsValid = false,
                ErrorMessage = "This invitation has already been accepted."
            });
        }

        if (invite.Status == ResidentInviteStatus.Cancelled)
        {
            return Result<ResidentInviteValidationDto>.Success(new ResidentInviteValidationDto
            {
                IsValid = false,
                ErrorMessage = "This invitation has been cancelled."
            });
        }

        if (invite.Status == ResidentInviteStatus.Expired || invite.IsExpired)
        {
            return Result<ResidentInviteValidationDto>.Success(new ResidentInviteValidationDto
            {
                IsValid = false,
                ErrorMessage = "This invitation has expired."
            });
        }

        // Get party name
        var partyName = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.Id == invite.PartyId)
            .Select(p => p.PartyName)
            .FirstOrDefaultAsync(cancellationToken);

        // Get unit info via lease
        var leaseInfo = await _dbContext.Leases
            .AsNoTracking()
            .Where(l => l.Id == invite.LeaseId)
            .Select(l => new
            {
                UnitId = l.UnitId,
                UnitNumber = _dbContext.Units
                    .Where(u => u.Id == l.UnitId)
                    .Select(u => u.UnitNumber)
                    .FirstOrDefault(),
                BlockName = _dbContext.Units
                    .Where(u => u.Id == l.UnitId)
                    .SelectMany(u => _dbContext.Blocks.Where(b => b.Id == u.BlockId))
                    .Select(b => b.Name)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);

        var unitLabel = leaseInfo != null
            ? $"{leaseInfo.BlockName}-{leaseInfo.UnitNumber}".Trim('-')
            : "Unknown Unit";

        // Get community name from tenant context
        var communityName = _tenantContext.TenantName ?? "Community";

        return Result<ResidentInviteValidationDto>.Success(new ResidentInviteValidationDto
        {
            IsValid = true,
            InviteId = invite.Id,
            CommunityName = communityName,
            UnitLabel = unitLabel,
            Email = invite.Email,
            PartyName = partyName,
            Role = invite.Role,
            ExpiresAt = invite.ExpiresAt
        });
    }
}
