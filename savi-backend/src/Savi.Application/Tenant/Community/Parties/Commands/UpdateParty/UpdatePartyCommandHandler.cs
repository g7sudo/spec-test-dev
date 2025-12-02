using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.UpdateParty;

/// <summary>
/// Handler for updating an existing party.
/// </summary>
public class UpdatePartyCommandHandler : IRequestHandler<UpdatePartyCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdatePartyCommandHandler> _logger;

    public UpdatePartyCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdatePartyCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(UpdatePartyCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating party {PartyId}", request.Id);

        var party = await _dbContext.Parties
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.IsActive, cancellationToken);

        if (party == null)
        {
            _logger.LogWarning("Party {PartyId} not found", request.Id);
            return Result<Unit>.Failure("Party not found.");
        }

        // Update based on party type
        if (party.PartyType == PartyType.Individual)
        {
            party.UpdateIndividual(
                firstName: request.FirstName ?? string.Empty,
                lastName: request.LastName ?? string.Empty,
                partyName: request.PartyName,
                legalName: request.LegalName,
                dateOfBirth: request.DateOfBirth,
                notes: request.Notes,
                updatedBy: _currentUser.TenantUserId);
        }
        else
        {
            party.UpdateCompanyOrEntity(
                partyName: request.PartyName,
                legalName: request.LegalName,
                registrationNumber: request.RegistrationNumber,
                taxNumber: request.TaxNumber,
                notes: request.Notes,
                updatedBy: _currentUser.TenantUserId);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Party {PartyId} updated successfully", request.Id);

        return Result<Unit>.Success(Unit.Value);
    }
}

