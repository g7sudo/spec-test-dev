using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyPartyInfo;

/// <summary>
/// Handler for updating the current user's party information.
/// </summary>
public class UpdateMyPartyInfoCommandHandler
    : IRequestHandler<UpdateMyPartyInfoCommand, Result<UpdateMyPartyInfoResult>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateMyPartyInfoCommandHandler> _logger;

    public UpdateMyPartyInfoCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdateMyPartyInfoCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<UpdateMyPartyInfoResult>> Handle(
        UpdateMyPartyInfoCommand request,
        CancellationToken cancellationToken)
    {
        // Get the community user for the current platform user
        var communityUser = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(cu => cu.PlatformUserId == _currentUser.UserId && cu.IsActive)
            .Select(cu => new { cu.Id, cu.PartyId })
            .FirstOrDefaultAsync(cancellationToken);

        if (communityUser == null)
        {
            return Result.Failure<UpdateMyPartyInfoResult>("Community user not found.");
        }

        _logger.LogInformation(
            "Updating party info for CommunityUser {CommunityUserId}, Party {PartyId}",
            communityUser.Id,
            communityUser.PartyId);

        // Get the party record
        var party = await _dbContext.Parties
            .FirstOrDefaultAsync(p => p.Id == communityUser.PartyId && p.IsActive, cancellationToken);

        if (party == null)
        {
            return Result.Failure<UpdateMyPartyInfoResult>("Party record not found.");
        }

        // Only update Individual parties (not Company/Entity)
        if (party.PartyType != PartyType.Individual)
        {
            return Result.Failure<UpdateMyPartyInfoResult>(
                "Cannot update party info for non-individual parties.");
        }

        // Update party fields if provided
        var firstName = request.FirstName ?? party.FirstName ?? string.Empty;
        var lastName = request.LastName ?? party.LastName ?? string.Empty;
        var partyName = $"{firstName} {lastName}".Trim();

        if (string.IsNullOrWhiteSpace(partyName))
        {
            partyName = party.PartyName; // Keep existing if no name provided
        }

        party.UpdateIndividual(
            firstName: firstName,
            lastName: lastName,
            partyName: partyName,
            legalName: party.LegalName,
            dateOfBirth: request.DateOfBirth ?? party.DateOfBirth,
            notes: party.Notes,
            updatedBy: communityUser.Id);

        // Update/create phone contact if provided
        string? primaryPhone = null;
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phoneContact = await _dbContext.PartyContacts
                .FirstOrDefaultAsync(pc =>
                    pc.PartyId == party.Id &&
                    pc.ContactType == PartyContactType.Mobile &&
                    pc.IsPrimary &&
                    pc.IsActive,
                    cancellationToken);

            if (phoneContact != null)
            {
                phoneContact.Update(
                    PartyContactType.Mobile,
                    request.PhoneNumber.Trim(),
                    isPrimary: true,
                    updatedBy: communityUser.Id);
                primaryPhone = request.PhoneNumber.Trim();
            }
            else
            {
                // Create new phone contact
                var newPhoneContact = PartyContact.Create(
                    party.Id,
                    PartyContactType.Mobile,
                    request.PhoneNumber.Trim(),
                    isPrimary: true,
                    createdBy: communityUser.Id);
                _dbContext.Add(newPhoneContact);
                primaryPhone = request.PhoneNumber.Trim();
            }
        }
        else
        {
            // Get existing primary phone
            primaryPhone = await _dbContext.PartyContacts
                .Where(pc =>
                    pc.PartyId == party.Id &&
                    pc.ContactType == PartyContactType.Mobile &&
                    pc.IsPrimary &&
                    pc.IsActive)
                .Select(pc => pc.Value)
                .FirstOrDefaultAsync(cancellationToken);
        }

        // Update/create email contact if provided
        string? primaryEmail = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailContact = await _dbContext.PartyContacts
                .FirstOrDefaultAsync(pc =>
                    pc.PartyId == party.Id &&
                    pc.ContactType == PartyContactType.Email &&
                    pc.IsPrimary &&
                    pc.IsActive,
                    cancellationToken);

            if (emailContact != null)
            {
                emailContact.Update(
                    PartyContactType.Email,
                    request.Email.ToLowerInvariant().Trim(),
                    isPrimary: true,
                    updatedBy: communityUser.Id);
                primaryEmail = request.Email.ToLowerInvariant().Trim();
            }
            else
            {
                // Create new email contact
                var newEmailContact = PartyContact.Create(
                    party.Id,
                    PartyContactType.Email,
                    request.Email.ToLowerInvariant().Trim(),
                    isPrimary: true,
                    createdBy: communityUser.Id);
                _dbContext.Add(newEmailContact);
                primaryEmail = request.Email.ToLowerInvariant().Trim();
            }
        }
        else
        {
            // Get existing primary email
            primaryEmail = await _dbContext.PartyContacts
                .Where(pc =>
                    pc.PartyId == party.Id &&
                    pc.ContactType == PartyContactType.Email &&
                    pc.IsPrimary &&
                    pc.IsActive)
                .Select(pc => pc.Value)
                .FirstOrDefaultAsync(cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Party info updated successfully for Party {PartyId}: {PartyName}",
            party.Id,
            partyName);

        return Result.Success(new UpdateMyPartyInfoResult
        {
            PartyId = party.Id,
            PartyName = partyName,
            FirstName = firstName,
            LastName = lastName,
            PrimaryEmail = primaryEmail,
            PrimaryPhone = primaryPhone
        });
    }
}
