using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.AddPartyAddress;

/// <summary>
/// Handler for adding an address to a party.
/// </summary>
public class AddPartyAddressCommandHandler : IRequestHandler<AddPartyAddressCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AddPartyAddressCommandHandler> _logger;

    public AddPartyAddressCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<AddPartyAddressCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(AddPartyAddressCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Adding {AddressType} address to party {PartyId}",
            request.AddressType,
            request.PartyId);

        // Verify party exists
        var partyExists = await _dbContext.Parties
            .AnyAsync(p => p.Id == request.PartyId && p.IsActive, cancellationToken);

        if (!partyExists)
        {
            _logger.LogWarning("Party {PartyId} not found", request.PartyId);
            return Result<Guid>.Failure("Party not found.");
        }

        // If this is set as primary, remove primary status from other addresses of the same type
        if (request.IsPrimary)
        {
            var existingPrimaryAddresses = await _dbContext.PartyAddresses
                .Where(a => a.PartyId == request.PartyId && a.IsPrimary && a.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var addr in existingPrimaryAddresses)
            {
                addr.RemovePrimaryStatus(_currentUser.TenantUserId);
            }
        }

        var address = PartyAddress.Create(
            partyId: request.PartyId,
            addressType: request.AddressType,
            line1: request.Line1,
            line2: request.Line2,
            city: request.City,
            state: request.State,
            country: request.Country,
            postalCode: request.PostalCode,
            isPrimary: request.IsPrimary,
            createdBy: _currentUser.TenantUserId);

        _dbContext.Add(address);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Address {AddressId} added to party {PartyId}",
            address.Id,
            request.PartyId);

        return Result<Guid>.Success(address.Id);
    }
}

