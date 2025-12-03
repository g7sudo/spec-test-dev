using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Ownership.Commands.EndOwnership;

/// <summary>
/// Handler for ending an ownership record.
/// </summary>
public class EndOwnershipCommandHandler
    : IRequestHandler<EndOwnershipCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public EndOwnershipCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        EndOwnershipCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Find ownership
        var ownership = await _dbContext.UnitOwnerships
            .FirstOrDefaultAsync(o =>
                o.Id == request.OwnershipId && o.IsActive,
                cancellationToken);

        if (ownership == null)
        {
            throw new NotFoundException("UnitOwnership", request.OwnershipId);
        }

        // Check if already ended
        if (ownership.ToDate.HasValue)
        {
            return Result.Failure("This ownership has already ended.");
        }

        // End the ownership
        ownership.EndOwnership(request.EndDate, _currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
