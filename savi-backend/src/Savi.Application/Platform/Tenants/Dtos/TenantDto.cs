using Savi.Domain.Platform;

namespace Savi.Application.Platform.Tenants.Dtos;

/// <summary>
/// DTO for tenant list/detail responses.
/// </summary>
public sealed record TenantDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public TenantStatus Status { get; init; }
    public string? AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Country { get; init; }
    public string? PostalCode { get; init; }
    public string? Timezone { get; init; }
    public string? PrimaryContactName { get; init; }
    public string? PrimaryContactEmail { get; init; }
    public string? PrimaryContactPhone { get; init; }
    public string Provider { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public bool IsActive { get; init; }
}

/// <summary>
/// Summary DTO for tenant list views (lighter payload).
/// </summary>
public sealed record TenantSummaryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public TenantStatus Status { get; init; }
    public string? City { get; init; }
    public string? Country { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool IsActive { get; init; }
}

/// <summary>
/// Request DTO for updating a tenant.
/// </summary>
public sealed record UpdateTenantRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string? AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Country { get; init; }
    public string? PostalCode { get; init; }
    public string? Timezone { get; init; }
    public string? PrimaryContactName { get; init; }
    public string? PrimaryContactEmail { get; init; }
    public string? PrimaryContactPhone { get; init; }
}

/// <summary>
/// Response DTO after updating a tenant.
/// </summary>
public sealed record UpdateTenantResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public DateTime UpdatedAt { get; init; }
}
