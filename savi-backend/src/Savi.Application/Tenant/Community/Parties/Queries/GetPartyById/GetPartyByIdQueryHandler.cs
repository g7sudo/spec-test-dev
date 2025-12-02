using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Parties.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Queries.GetPartyById;

/// <summary>
/// Handler for getting a party by ID.
/// </summary>
public class GetPartyByIdQueryHandler : IRequestHandler<GetPartyByIdQuery, Result<PartyDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ILogger<GetPartyByIdQueryHandler> _logger;

    public GetPartyByIdQueryHandler(
        ITenantDbContext dbContext,
        ILogger<GetPartyByIdQueryHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Result<PartyDto>> Handle(GetPartyByIdQuery request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting party {PartyId}", request.Id);

        var party = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.Id == request.Id && p.IsActive)
            .Select(p => new PartyDto
            {
                Id = p.Id,
                PartyType = p.PartyType,
                PartyName = p.PartyName,
                LegalName = p.LegalName,
                FirstName = p.FirstName,
                LastName = p.LastName,
                DateOfBirth = p.DateOfBirth,
                RegistrationNumber = p.RegistrationNumber,
                TaxNumber = p.TaxNumber,
                Notes = p.Notes,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (party == null)
        {
            _logger.LogWarning("Party {PartyId} not found", request.Id);
            return Result<PartyDto>.Failure("Party not found.");
        }

        // Get addresses
        var addresses = await _dbContext.PartyAddresses
            .AsNoTracking()
            .Where(a => a.PartyId == request.Id && a.IsActive)
            .Select(a => new PartyAddressDto
            {
                Id = a.Id,
                PartyId = a.PartyId,
                AddressType = a.AddressType,
                Line1 = a.Line1,
                Line2 = a.Line2,
                City = a.City,
                State = a.State,
                Country = a.Country,
                PostalCode = a.PostalCode,
                IsPrimary = a.IsPrimary,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        // Get contacts
        var contacts = await _dbContext.PartyContacts
            .AsNoTracking()
            .Where(c => c.PartyId == request.Id && c.IsActive)
            .Select(c => new PartyContactDto
            {
                Id = c.Id,
                PartyId = c.PartyId,
                ContactType = c.ContactType,
                Value = c.Value,
                IsPrimary = c.IsPrimary,
                IsVerified = c.IsVerified,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        // Return party with addresses and contacts
        return Result<PartyDto>.Success(party with
        {
            Addresses = addresses,
            Contacts = contacts
        });
    }
}

