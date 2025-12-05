namespace Savi.Application.Tenant.Rbac.Dtos;

/// <summary>
/// DTO for tenant permission information.
/// </summary>
public record TenantPermissionDto(
    string Key,
    string Module,
    string Description
);

/// <summary>
/// DTO for permission with enabled state for a role group.
/// </summary>
public record RoleGroupPermissionDto(
    string Key,
    string Module,
    string Description,
    bool IsEnabled
);
