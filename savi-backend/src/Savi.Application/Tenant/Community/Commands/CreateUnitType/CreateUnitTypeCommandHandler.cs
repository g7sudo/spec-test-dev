using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.CreateUnitType;
public class CreateUnitTypeCommandHandler : IRequestHandler<CreateUnitTypeCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public CreateUnitTypeCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result<Guid>> Handle(CreateUnitTypeCommand request, CancellationToken cancellationToken)
    {
        // Check if code already exists
        var codeExists = await _dbContext.UnitTypes
            .AsNoTracking()
            .AnyAsync(x => x.Code == request.Code && x.IsActive, cancellationToken);
        if (codeExists)
        {
            return Result<Guid>.Failure($"Unit type with code '{request.Code}' already exists.");
        }

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result<Guid>.Failure("User does not exist in the current tenant. Contact your administrator.");

        var unitType = UnitType.Create(
            request.Code,
            request.Name,
            request.Description,
            request.DefaultParkingSlots,
            request.DefaultOccupancyLimit,
            _currentUser.TenantUserId.Value
        );
        _dbContext.Add(unitType);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(unitType.Id);
    }
}
