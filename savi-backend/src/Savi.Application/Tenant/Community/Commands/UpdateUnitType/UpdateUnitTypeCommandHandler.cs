using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.UpdateUnitType;
public class UpdateUnitTypeCommandHandler : IRequestHandler<UpdateUnitTypeCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public UpdateUnitTypeCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result<Guid>> Handle(UpdateUnitTypeCommand request, CancellationToken cancellationToken)
    {
        var unitType = await _dbContext.UnitTypes
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (unitType == null)
        {
            throw new NotFoundException("UnitType", request.Id);
        }

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result<Guid>.Failure("User does not exist in the current tenant. Contact your administrator.");

        // Check if code already exists for another unit type
        var codeExists = await _dbContext.UnitTypes
            .AsNoTracking()
            .AnyAsync(x => x.Code == request.Code && x.Id != request.Id && x.IsActive, cancellationToken);
        if (codeExists)
            return Result<Guid>.Failure($"Unit type with code '{request.Code}' already exists.");

        unitType.Update(
            request.Code,
            request.Name,
            request.Description,
            request.DefaultParkingSlots,
            request.DefaultOccupancyLimit,
            _currentUser.TenantUserId.Value
        );
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(unitType.Id);
    }
}
