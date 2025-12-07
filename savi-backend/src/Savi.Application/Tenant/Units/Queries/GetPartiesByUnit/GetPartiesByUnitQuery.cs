using MediatR;
using Savi.Application.Tenant.Units.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Units.Queries.GetPartiesByUnit;

/// <summary>
/// Filter options for party association type.
/// </summary>
public enum PartyAssociationFilter
{
    /// <summary>
    /// Return all parties (residents and owners).
    /// </summary>
    All,

    /// <summary>
    /// Return only residents (from active leases).
    /// </summary>
    Residents,

    /// <summary>
    /// Return only owners.
    /// </summary>
    Owners
}

/// <summary>
/// Query to get parties (residents and/or owners) associated with a unit.
/// Supports filtering by association type and primary status.
/// </summary>
public record GetPartiesByUnitQuery(
    Guid UnitId,
    PartyAssociationFilter AssociationFilter = PartyAssociationFilter.All,
    bool? PrimaryOnly = null
) : IRequest<Result<List<UnitPartyDto>>>;
