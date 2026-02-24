using MediatR;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.CreateParty;

/// <summary>
/// Handler for creating a new party.
/// </summary>
public class CreatePartyCommandHandler : IRequestHandler<CreatePartyCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<CreatePartyCommandHandler> _logger;

    public CreatePartyCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<CreatePartyCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreatePartyCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Creating party of type {PartyType} with name {PartyName}",
            request.PartyType,
            request.PartyName);

        Party party;

        // Create appropriate party type using factory methods
        if (request.PartyType == PartyType.Individual)
        {
            party = Party.CreateIndividual(
                firstName: request.FirstName ?? string.Empty,
                lastName: request.LastName ?? string.Empty,
                partyName: request.PartyName,
                legalName: request.LegalName,
                dateOfBirth: request.DateOfBirth,
                notes: request.Notes,
                createdBy: _currentUser.TenantUserId);
        }
        else
        {
            party = Party.CreateCompanyOrEntity(
                partyType: request.PartyType,
                partyName: request.PartyName,
                legalName: request.LegalName,
                registrationNumber: request.RegistrationNumber,
                taxNumber: request.TaxNumber,
                notes: request.Notes,
                createdBy: _currentUser.TenantUserId);
        }

        _dbContext.Add(party);

        // Create contact entries for the party in the same transaction
        foreach (var contactItem in request.Contacts)
        {
            var contact = PartyContact.Create(
                partyId: party.Id,
                contactType: contactItem.ContactType,
                value: contactItem.Value,
                isPrimary: contactItem.IsPrimary,
                createdBy: _currentUser.TenantUserId);

            _dbContext.Add(contact);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Party {PartyId} created with {ContactCount} contacts",
            party.Id,
            request.Contacts.Count);

        return Result<Guid>.Success(party.Id);
    }
}

