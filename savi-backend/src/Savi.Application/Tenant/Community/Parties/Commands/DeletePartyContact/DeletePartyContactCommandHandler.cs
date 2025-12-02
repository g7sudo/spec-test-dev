using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.DeletePartyContact;

/// <summary>
/// Handler for soft-deleting a party contact.
/// </summary>
public class DeletePartyContactCommandHandler : IRequestHandler<DeletePartyContactCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeletePartyContactCommandHandler> _logger;

    public DeletePartyContactCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<DeletePartyContactCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(DeletePartyContactCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Deleting contact {ContactId} from party {PartyId}",
            request.ContactId,
            request.PartyId);

        var contact = await _dbContext.PartyContacts
            .FirstOrDefaultAsync(
                c => c.Id == request.ContactId && c.PartyId == request.PartyId && c.IsActive,
                cancellationToken);

        if (contact == null)
        {
            _logger.LogWarning("Contact {ContactId} not found for party {PartyId}", request.ContactId, request.PartyId);
            return Result<Unit>.Failure("Contact not found.");
        }

        // Soft delete the contact
        contact.Deactivate(_currentUser.TenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Contact {ContactId} deleted successfully", request.ContactId);

        return Result<Unit>.Success(Unit.Value);
    }
}

