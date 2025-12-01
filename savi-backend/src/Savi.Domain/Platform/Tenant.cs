using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Represents a community/residential complex with its own database.
/// Each tenant has a separate TenantDB with an isolated schema.
/// </summary>
public class Tenant : BaseEntity
{
    /// <summary>
    /// Display name of the community.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Optional short code/slug for the tenant (e.g., "green-meadows").
    /// </summary>
    public string? Code { get; private set; }

    /// <summary>
    /// Current status of the tenant.
    /// </summary>
    public TenantStatus Status { get; private set; } = TenantStatus.Active;

    // Address fields
    public string? AddressLine1 { get; private set; }
    public string? AddressLine2 { get; private set; }
    public string? City { get; private set; }
    public string? State { get; private set; }
    public string? Country { get; private set; }
    public string? PostalCode { get; private set; }

    /// <summary>
    /// Timezone for this tenant (e.g., "Asia/Bahrain").
    /// </summary>
    public string? Timezone { get; private set; }

    // Primary contact
    public string? PrimaryContactName { get; private set; }
    public string? PrimaryContactEmail { get; private set; }
    public string? PrimaryContactPhone { get; private set; }

    /// <summary>
    /// Database provider (e.g., "postgres", "sqlserver", "sqlite").
    /// </summary>
    public string Provider { get; private set; } = "postgres";

    /// <summary>
    /// Connection string for this tenant's database.
    /// </summary>
    public string ConnectionString { get; private set; } = string.Empty;

    // Navigation properties
    private readonly List<UserTenantMembership> _memberships = new();
    public IReadOnlyCollection<UserTenantMembership> Memberships => _memberships.AsReadOnly();

    private readonly List<TenantPlan> _plans = new();
    public IReadOnlyCollection<TenantPlan> Plans => _plans.AsReadOnly();

    // Private constructor for EF
    private Tenant() { }

    /// <summary>
    /// Creates a new tenant.
    /// </summary>
    public static Tenant Create(
        string name,
        string provider,
        string connectionString,
        string? code = null,
        Guid? createdBy = null)
    {
        var tenant = new Tenant
        {
            Name = name.Trim(),
            Code = code?.Trim().ToLowerInvariant(),
            Provider = provider,
            ConnectionString = connectionString,
            Status = TenantStatus.Active
        };

        tenant.SetCreatedBy(createdBy);
        return tenant;
    }

    /// <summary>
    /// Updates the tenant's basic information.
    /// </summary>
    public void UpdateInfo(
        string name,
        string? code = null,
        string? timezone = null,
        Guid? updatedBy = null)
    {
        Name = name.Trim();
        Code = code?.Trim().ToLowerInvariant();
        Timezone = timezone;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the tenant's address.
    /// </summary>
    public void UpdateAddress(
        string? addressLine1,
        string? addressLine2,
        string? city,
        string? state,
        string? country,
        string? postalCode,
        Guid? updatedBy = null)
    {
        AddressLine1 = addressLine1?.Trim();
        AddressLine2 = addressLine2?.Trim();
        City = city?.Trim();
        State = state?.Trim();
        Country = country?.Trim();
        PostalCode = postalCode?.Trim();
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the tenant's primary contact.
    /// </summary>
    public void UpdatePrimaryContact(
        string? name,
        string? email,
        string? phone,
        Guid? updatedBy = null)
    {
        PrimaryContactName = name?.Trim();
        PrimaryContactEmail = email?.Trim().ToLowerInvariant();
        PrimaryContactPhone = phone?.Trim();
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Suspends the tenant.
    /// </summary>
    public void Suspend(Guid? updatedBy = null)
    {
        Status = TenantStatus.Suspended;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Archives the tenant.
    /// </summary>
    public void Archive(Guid? updatedBy = null)
    {
        Status = TenantStatus.Archived;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Reactivates a suspended or archived tenant.
    /// </summary>
    public void Reactivate(Guid? updatedBy = null)
    {
        Status = TenantStatus.Active;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the database connection settings.
    /// </summary>
    public void UpdateConnectionInfo(string provider, string connectionString, Guid? updatedBy = null)
    {
        Provider = provider;
        ConnectionString = connectionString;
        MarkAsUpdated(updatedBy);
    }
}

/// <summary>
/// Status of a tenant.
/// </summary>
public enum TenantStatus
{
    /// <summary>Tenant is pending initial setup.</summary>
    Pending,

    /// <summary>Tenant is active and operational.</summary>
    Active,

    /// <summary>Tenant is temporarily suspended.</summary>
    Suspended,

    /// <summary>Tenant is archived (soft-deleted).</summary>
    Archived
}

