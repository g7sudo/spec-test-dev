using MediatR;
using Savi.Application.Tenant.Community.Parties.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Queries.ListParties;

/// <summary>
/// Query to list parties with pagination and optional filtering.
/// </summary>
public record ListPartiesQuery : IRequest<Result<PagedResult<PartyDto>>>
{
    /// <summary>
    /// Page number (1-based).
    /// </summary>
    public int Page { get; init; } = 1;

    /// <summary>
    /// Number of items per page.
    /// </summary>
    public int PageSize { get; init; } = 20;

    /// <summary>
    /// Optional filter by party type.
    /// </summary>
    public PartyType? PartyType { get; init; }

    /// <summary>
    /// Optional search term (searches party name).
    /// </summary>
    public string? SearchTerm { get; init; }
}

