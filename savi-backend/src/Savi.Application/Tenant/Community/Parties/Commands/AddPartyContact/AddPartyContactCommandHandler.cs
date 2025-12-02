using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.AddPartyContact;

/// <summary>
/// Handler for adding a contact to a party.
/// </summary>
public class AddPartyContactCommandHandler : IRequestHandler<AddPartyContactCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AddPartyContactCommandHandler> _logger;

    public AddPartyContactCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<AddPartyContactCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(AddPartyContactCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Adding {ContactType} contact to party {PartyId}",
            request.ContactType,
            request.PartyId);

        // Verify party exists
        var partyExists = await _dbContext.Parties
            .AnyAsync(p => p.Id == request.PartyId && p.IsActive, cancellationToken);

        if (!partyExists)
        {
            _logger.LogWarning("Party {PartyId} not found", request.PartyId);
            return Result<Guid>.Failure("Party not found.");
        }

        // If this is set as primary, remove primary status from other contacts of the same type
        if (request.IsPrimary)
        {
            var existingPrimaryContacts = await _dbContext.PartyContacts
                .Where(c => c.PartyId == request.PartyId &&
                            c.ContactType == request.ContactType &&
                            c.IsPrimary &&
                            c.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var contact in existingPrimaryContacts)
            {
                contact.RemovePrimaryStatus(_currentUser.TenantUserId);
            }
        }

        var newContact = PartyContact.Create(
            partyId: request.PartyId,
            contactType: request.ContactType,
            value: request.Value,
            isPrimary: request.IsPrimary,
            createdBy: _currentUser.TenantUserId);

        _dbContext.Add(newContact);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Contact {ContactId} added to party {PartyId}",
            newContact.Id,
            request.PartyId);

        return Result<Guid>.Success(newContact.Id);
    }
}

