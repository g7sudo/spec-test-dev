namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Type of party in the community.
/// Maps to DBML: Enum PartyType
/// </summary>
public enum PartyType
{
    /// <summary>
    /// Individual person (resident, owner, etc.)
    /// </summary>
    Individual,

    /// <summary>
    /// Company entity (real estate company, management firm, etc.)
    /// </summary>
    Company,

    /// <summary>
    /// Other entity types (trusts, associations, etc.)
    /// </summary>
    Entity
}

