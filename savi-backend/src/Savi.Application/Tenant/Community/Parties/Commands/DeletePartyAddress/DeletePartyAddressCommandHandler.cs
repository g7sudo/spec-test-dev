using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Parties.Commands.DeletePartyAddress;

/// <summary>
/// Handler for soft-deleting a party address.
/// </summary>
public class DeletePartyAddressCommandHandler : IRequestHandler<DeletePartyAddressCommand, Result<Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeletePartyAddressCommandHandler> _logger;

    public DeletePartyAddressCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<DeletePartyAddressCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(DeletePartyAddressCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Deleting address {AddressId} from party {PartyId}",
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

        // Soft delete the address
        address.Deactivate(_currentUser.TenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Address {AddressId} deleted successfully", request.AddressId);

        return Result<Unit>.Success(Unit.Value);
    }
}

