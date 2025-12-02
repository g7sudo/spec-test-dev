namespace Savi.Application.Platform.Commands.MigrateTenantDatabases;

/// <summary>
/// Result of tenant database migration operation.
/// </summary>
public record MigrationResultDto
{
    public int TotalTenants { get; init; }
    public int SuccessfulMigrations { get; init; }
    public int FailedMigrations { get; init; }
    public List<TenantMigrationInfo> TenantResults { get; init; } = new();
}

public record TenantMigrationInfo
{
    public Guid TenantId { get; init; }
    public string TenantCode { get; init; } = string.Empty;
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public List<string> AppliedMigrations { get; init; } = new();
}
