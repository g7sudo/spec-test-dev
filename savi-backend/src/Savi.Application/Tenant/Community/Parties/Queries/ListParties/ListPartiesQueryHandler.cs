using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Parties.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Queries.ListParties;

/// <summary>
/// Handler for listing parties with pagination.
/// </summary>
public class ListPartiesQueryHandler : IRequestHandler<ListPartiesQuery, Result<PagedResult<PartyDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ILogger<ListPartiesQueryHandler> _logger;

    public ListPartiesQueryHandler(
        ITenantDbContext dbContext,
        ILogger<ListPartiesQueryHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Result<PagedResult<PartyDto>>> Handle(ListPartiesQuery request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Listing parties - Page: {Page}, PageSize: {PageSize}, PartyType: {PartyType}",
            request.Page,
            request.PageSize,
            request.PartyType);

        var query = _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.IsActive);

        // Apply filters
        if (request.PartyType.HasValue)
        {
            query = query.Where(p => p.PartyType == request.PartyType.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(p =>
                p.PartyName.ToLower().Contains(searchTerm) ||
                (p.FirstName != null && p.FirstName.ToLower().Contains(searchTerm)) ||
                (p.LastName != null && p.LastName.ToLower().Contains(searchTerm)) ||
                (p.LegalName != null && p.LegalName.ToLower().Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and get results
        var parties = await query
            .OrderBy(p => p.PartyName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
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
            .ToListAsync(cancellationToken);

        var result = new PagedResult<PartyDto>(
            parties,
            totalCount,
            request.Page,
            request.PageSize);

        return Result<PagedResult<PartyDto>>.Success(result);
    }
}

