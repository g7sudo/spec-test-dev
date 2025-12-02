using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.DeleteParty;

/// <summary>
/// Handler for soft-deleting a party.
/// </summary>
public class DeletePartyCommandHandler : IRequestHandler<DeletePartyCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeletePartyCommandHandler> _logger;

    public DeletePartyCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<DeletePartyCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(DeletePartyCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting party {PartyId}", request.Id);

        var party = await _dbContext.Parties
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.IsActive, cancellationToken);

        if (party == null)
        {
            _logger.LogWarning("Party {PartyId} not found", request.Id);
            return Result<Unit>.Failure("Party not found.");
        }

        // Soft delete the party
        party.Deactivate(_currentUser.TenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Party {PartyId} deleted successfully", request.Id);

        return Result<Unit>.Success(Unit.Value);
    }
}

