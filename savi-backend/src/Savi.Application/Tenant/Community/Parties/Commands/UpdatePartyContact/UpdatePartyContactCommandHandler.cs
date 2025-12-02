using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.UpdatePartyContact;

/// <summary>
/// Handler for updating a party contact.
/// </summary>
public class UpdatePartyContactCommandHandler : IRequestHandler<UpdatePartyContactCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdatePartyContactCommandHandler> _logger;

    public UpdatePartyContactCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdatePartyContactCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(UpdatePartyContactCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Updating contact {ContactId} for party {PartyId}",
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

        // If this is set as primary, remove primary status from other contacts of the same type
        if (request.IsPrimary && !contact.IsPrimary)
        {
            var existingPrimaryContacts = await _dbContext.PartyContacts
                .Where(c => c.PartyId == request.PartyId &&
                            c.ContactType == request.ContactType &&
                            c.IsPrimary &&
                            c.IsActive &&
                            c.Id != request.ContactId)
                .ToListAsync(cancellationToken);

            foreach (var c in existingPrimaryContacts)
            {
                c.RemovePrimaryStatus(_currentUser.TenantUserId);
            }
        }

        // Check if value changed - if so, remove verification
        var valueChanged = contact.Value != request.Value;

        contact.Update(
            contactType: request.ContactType,
            value: request.Value,
            isPrimary: request.IsPrimary,
            updatedBy: _currentUser.TenantUserId);

        // If value changed, remove verification status
        if (valueChanged && contact.IsVerified)
        {
            contact.RemoveVerification(_currentUser.TenantUserId);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Contact {ContactId} updated successfully", request.ContactId);

        return Result<Unit>.Success(Unit.Value);
    }
}

