using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Tenants.Commands.UpdateTenant;

/// <summary>
/// Handler for UpdateTenantCommand.
/// Updates an existing tenant in PlatformDB.
/// </summary>
public sealed class UpdateTenantCommandHandler
    : IRequestHandler<UpdateTenantCommand, Result<UpdateTenantResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateTenantCommandHandler> _logger;

    public UpdateTenantCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<UpdateTenantCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<UpdateTenantResponse>> Handle(
        UpdateTenantCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;

        _logger.LogInformation(
            "Updating tenant {TenantId} by user {UserId}",
            command.TenantId,
            _currentUser.UserId);

        // Load tenant with tracking for updates
        var tenant = await _platformDbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == command.TenantId, cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<UpdateTenantResponse>("Tenant not found.");
        }

        // Check if code is being changed and validate uniqueness
        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != tenant.Code)
        {
            var codeExists = await _platformDbContext.Tenants
                .AnyAsync(t => t.Code == request.Code && t.Id != command.TenantId, cancellationToken);

            if (codeExists)
            {
                return Result.Failure<UpdateTenantResponse>($"Tenant code '{request.Code}' already exists.");
            }
        }

        // Update basic info
        tenant.UpdateInfo(
            name: request.Name,
            code: request.Code,
            timezone: request.Timezone,
            updatedBy: _currentUser.UserId);

        // Update address
        tenant.UpdateAddress(
            addressLine1: request.AddressLine1,
            addressLine2: request.AddressLine2,
            city: request.City,
            state: request.State,
            country: request.Country,
            postalCode: request.PostalCode,
            updatedBy: _currentUser.UserId);

        // Update primary contact
        tenant.UpdatePrimaryContact(
            name: request.PrimaryContactName,
            email: request.PrimaryContactEmail,
            phone: request.PrimaryContactPhone,
            updatedBy: _currentUser.UserId);

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated tenant {TenantId} ({TenantCode}) - {TenantName}",
            tenant.Id,
            tenant.Code,
            tenant.Name);

        return Result.Success(new UpdateTenantResponse
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Code = tenant.Code,
            UpdatedAt = tenant.UpdatedAt ?? DateTime.UtcNow
        });
    }
}
