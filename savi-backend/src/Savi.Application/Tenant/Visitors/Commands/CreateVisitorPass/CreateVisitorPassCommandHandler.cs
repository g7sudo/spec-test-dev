using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Visitors.Commands.CreateVisitorPass;

/// <summary>
/// Handler for creating a new pre-registered visitor pass.
/// </summary>
public class CreateVisitorPassCommandHandler
    : IRequestHandler<CreateVisitorPassCommand, Result<CreateVisitorPassResult>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateVisitorPassCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<CreateVisitorPassResult>> Handle(
        CreateVisitorPassCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<CreateVisitorPassResult>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<CreateVisitorPassResult>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Generate unique access code
        var accessCode = await GenerateAccessCodeAsync(cancellationToken);

        // Calculate expiration (default: end of expected window or 24 hours from now)
        var expiresAt = request.ExpectedTo ?? DateTime.UtcNow.AddHours(24);

        // Create the visitor pass
        var visitorPass = VisitorPass.CreatePreRegistered(
            request.UnitId,
            request.VisitorName,
            request.VisitType,
            accessCode,
            _currentUser.TenantUserId.Value,
            request.VisitorPhone,
            request.VehicleNumber,
            request.VehicleType,
            request.DeliveryProvider,
            request.Notes,
            request.ExpectedFrom,
            request.ExpectedTo,
            expiresAt,
            request.NotifyVisitorAtGate,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(visitorPass);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<CreateVisitorPassResult>.Success(
            new CreateVisitorPassResult(visitorPass.Id, accessCode));
    }

    private async Task<string> GenerateAccessCodeAsync(CancellationToken cancellationToken)
    {
        // Generate a unique 8-digit access code in format XXXX-XXXX
        var random = new Random();
        string accessCode;
        bool isUnique;

        do
        {
            var part1 = random.Next(1000, 9999);
            var part2 = random.Next(1000, 9999);
            accessCode = $"{part1}-{part2}";

            // Check if code already exists for active passes
            isUnique = !await _dbContext.VisitorPasses
                .AsNoTracking()
                .AnyAsync(v => v.AccessCode == accessCode && v.IsActive, cancellationToken);
        }
        while (!isUnique);

        return accessCode;
    }
}
