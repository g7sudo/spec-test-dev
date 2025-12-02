namespace Savi.Application.Platform.Tenants.Dtos;

/// <summary>
/// DTO for creating a new tenant (community).
/// </summary>
public sealed record CreateTenantRequest
{
    /// <summary>
    /// Name of the community/tenant.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Unique code/slug for the tenant (optional, auto-generated if not provided).
    /// </summary>
    public string? Code { get; init; }

    /// <summary>
    /// Address line 1.
    /// </summary>
    public string? AddressLine1 { get; init; }

    /// <summary>
    /// Address line 2.
    /// </summary>
    public string? AddressLine2 { get; init; }

    /// <summary>
    /// City.
    /// </summary>
    public string? City { get; init; }

    /// <summary>
    /// State/Province.
    /// </summary>
    public string? State { get; init; }

    /// <summary>
    /// Country.
    /// </summary>
    public string? Country { get; init; }

    /// <summary>
    /// Postal/ZIP code.
    /// </summary>
    public string? PostalCode { get; init; }

    /// <summary>
    /// Timezone (e.g., "America/New_York").
    /// </summary>
    public string? Timezone { get; init; }

    /// <summary>
    /// Primary contact name.
    /// </summary>
    public string? PrimaryContactName { get; init; }

    /// <summary>
    /// Primary contact email.
    /// </summary>
    public string? PrimaryContactEmail { get; init; }

    /// <summary>
    /// Primary contact phone.
    /// </summary>
    public string? PrimaryContactPhone { get; init; }

    /// <summary>
    /// Optional explicit plan identifier.
    /// </summary>
    public Guid? PlanId { get; init; }

    /// <summary>
    /// Optional plan code (e.g. BASIC, STANDARD). Used when PlanId is not provided.
    /// </summary>
    public string? PlanCode { get; init; }

    /// <summary>
    /// Database provider for the tenant (e.g., "postgresql", "sqlite"). Defaults to "postgresql".
    /// </summary>
    public string? DatabaseProvider { get; init; }

    /// <summary>
    /// Connection string for the tenant database. If omitted, the backend generates one from the tenant code.
    /// </summary>
    public string? ConnectionString { get; init; }

    /// <summary>
    /// When true (default), the backend will automatically create/migrate the tenant DB.
    /// </summary>
    public bool ProvisionTenantDatabase { get; init; } = true;

    /// <summary>
    /// When true (default), the backend seeds default tenant role groups & permissions.
    /// </summary>
    public bool SeedTenantRbac { get; init; } = true;
}

/// <summary>
/// Response after creating a tenant.
/// </summary>
public sealed record CreateTenantResponse
{
    /// <summary>
    /// ID of the newly created tenant.
    /// </summary>
    public Guid TenantId { get; init; }

    /// <summary>
    /// Code/slug of the tenant.
    /// </summary>
    public string Code { get; init; } = string.Empty;

    /// <summary>
    /// Name of the tenant.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Code of the plan that was assigned.
    /// </summary>
    public string PlanCode { get; init; } = string.Empty;

    /// <summary>
    /// Database provider used for this tenant.
    /// </summary>
    public string Provider { get; init; } = string.Empty;
}

