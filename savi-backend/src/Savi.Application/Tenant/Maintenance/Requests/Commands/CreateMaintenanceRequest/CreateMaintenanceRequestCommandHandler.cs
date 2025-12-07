using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.CreateMaintenanceRequest;

/// <summary>
/// Handler for creating a new maintenance request.
/// </summary>
public class CreateMaintenanceRequestCommandHandler
    : IRequestHandler<CreateMaintenanceRequestCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateMaintenanceRequestCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<Guid>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Validate category exists
        var categoryExists = await _dbContext.MaintenanceCategories
            .AsNoTracking()
            .AnyAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (!categoryExists)
        {
            return Result<Guid>.Failure($"Category with ID '{request.CategoryId}' not found.");
        }

        // Validate party exists
        var partyExists = await _dbContext.Parties
            .AsNoTracking()
            .AnyAsync(p => p.Id == request.RequestedForPartyId && p.IsActive, cancellationToken);

        if (!partyExists)
        {
            return Result<Guid>.Failure($"Party with ID '{request.RequestedForPartyId}' not found.");
        }

        // Generate ticket number
        var ticketNumber = await GenerateTicketNumberAsync(cancellationToken);

        // Create the maintenance request
        var maintenanceRequest = MaintenanceRequest.Create(
            ticketNumber,
            request.UnitId,
            request.CategoryId,
            request.RequestedForPartyId,
            _currentUser.TenantUserId.Value,
            request.Title,
            request.Description,
            request.Priority,
            request.Source,
            request.DueBy,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(maintenanceRequest);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(maintenanceRequest.Id);
    }

    private async Task<string> GenerateTicketNumberAsync(CancellationToken cancellationToken)
    {
        // Get the latest ticket number and increment
        var latestRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (latestRequest != null && !string.IsNullOrEmpty(latestRequest.TicketNumber))
        {
            // Parse the number from MT-XXXXXX format
            var parts = latestRequest.TicketNumber.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[1], out var currentNumber))
            {
                nextNumber = currentNumber + 1;
            }
        }

        return $"MT-{nextNumber:D6}";
    }
}
