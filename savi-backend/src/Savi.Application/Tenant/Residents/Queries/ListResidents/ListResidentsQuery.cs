using MediatR;
using Savi.Application.Tenant.Residents.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Residents.Queries.ListResidents;

/// <summary>
/// Query to list all residents with filters.
/// Residents are derived from LeaseParty records with Role in [PrimaryResident, CoResident].
/// </summary>
public record ListResidentsQuery(
    /// <summary>
    /// Filter by residency status (Current, Upcoming, Past).
    /// </summary>
    ResidencyStatus? Status = null,

    /// <summary>
    /// Filter by specific unit ID.
    /// </summary>
    Guid? UnitId = null,

    /// <summary>
    /// Filter by block ID.
    /// </summary>
    Guid? BlockId = null,

    /// <summary>
    /// Filter by floor ID.
    /// </summary>
    Guid? FloorId = null,

    /// <summary>
    /// Filter by app access status.
    /// </summary>
    bool? HasAppAccess = null,

    /// <summary>
    /// Search term (matches name, email, phone).
    /// </summary>
    string? SearchTerm = null,

    /// <summary>
    /// Page number (1-based).
    /// </summary>
    int Page = 1,

    /// <summary>
    /// Page size.
    /// </summary>
    int PageSize = 20
) : IRequest<Result<PagedResult<ResidentDto>>>;
