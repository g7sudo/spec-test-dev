using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Tenants.Commands.ArchiveTenant;

/// <summary>
/// Handler for ArchiveTenantCommand.
/// Soft-deletes a tenant by setting status to Archived.
/// </summary>
public sealed class ArchiveTenantCommandHandler
    : IRequestHandler<ArchiveTenantCommand, Result<Unit>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<ArchiveTenantCommandHandler> _logger;

    public ArchiveTenantCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<ArchiveTenantCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(
        ArchiveTenantCommand command,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Archiving tenant {TenantId} by user {UserId}",
            command.TenantId,
            _currentUser.UserId);

        // Load tenant with tracking
        var tenant = await _platformDbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == command.TenantId, cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<Unit>("Tenant not found.");
        }

        if (tenant.Status == TenantStatus.Archived)
        {
            return Result.Failure<Unit>("Tenant is already archived.");
        }

        // Archive the tenant (soft-delete)
        tenant.Archive(updatedBy: _currentUser.UserId);

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Archived tenant {TenantId} ({TenantCode})",
            tenant.Id,
            tenant.Code);

        return Result.Success(Unit.Value);
    }
}
