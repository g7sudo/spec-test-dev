using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.UpdatePartyAddress;

/// <summary>
/// Handler for updating a party address.
/// </summary>
public class UpdatePartyAddressCommandHandler : IRequestHandler<UpdatePartyAddressCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdatePartyAddressCommandHandler> _logger;

    public UpdatePartyAddressCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdatePartyAddressCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(UpdatePartyAddressCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Updating address {AddressId} for party {PartyId}",
            request.AddressId,
            request.PartyId);

        var address = await _dbContext.PartyAddresses
            .FirstOrDefaultAsync(
                a => a.Id == request.AddressId && a.PartyId == request.PartyId && a.IsActive,
                cancellationToken);

        if (address == null)
        {
            _logger.LogWarning("Address {AddressId} not found for party {PartyId}", request.AddressId, request.PartyId);
            return Result<Unit>.Failure("Address not found.");
        }

        // If this is set as primary, remove primary status from other addresses
        if (request.IsPrimary && !address.IsPrimary)
        {
            var existingPrimaryAddresses = await _dbContext.PartyAddresses
                .Where(a => a.PartyId == request.PartyId && a.IsPrimary && a.IsActive && a.Id != request.AddressId)
                .ToListAsync(cancellationToken);

            foreach (var addr in existingPrimaryAddresses)
            {
                addr.RemovePrimaryStatus(_currentUser.TenantUserId);
            }
        }

        address.Update(
            addressType: request.AddressType,
            line1: request.Line1,
            line2: request.Line2,
            city: request.City,
            state: request.State,
            country: request.Country,
            postalCode: request.PostalCode,
            isPrimary: request.IsPrimary,
            updatedBy: _currentUser.TenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Address {AddressId} updated successfully", request.AddressId);

        return Result<Unit>.Success(Unit.Value);
    }
}

