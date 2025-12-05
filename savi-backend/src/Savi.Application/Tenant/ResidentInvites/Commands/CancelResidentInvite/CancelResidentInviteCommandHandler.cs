using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.ResidentInvites.Commands.CancelResidentInvite;

/// <summary>
/// Handler for cancelling a resident invite.
/// </summary>
public class CancelResidentInviteCommandHandler
    : IRequestHandler<CancelResidentInviteCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CancelResidentInviteCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        CancelResidentInviteCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Get the invite
        var invite = await _dbContext.ResidentInvites
            .FirstOrDefaultAsync(ri => ri.Id == request.InviteId && ri.IsActive, cancellationToken);

        if (invite == null)
        {
            return Result<bool>.Failure("Invite not found.");
        }

        if (invite.Status != ResidentInviteStatus.Pending)
        {
            return Result<bool>.Failure($"Cannot cancel invite with status {invite.Status}.");
        }

        // Cancel the invite
        invite.Cancel(_currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
