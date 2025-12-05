namespace Savi.Application.Platform.Rbac.Dtos;

/// <summary>
/// DTO for permission information.
/// </summary>
public record PermissionDto(
    Guid Id,
    string Key,
    string Module,
    string Description,
    string Scope
);

/// <summary>
/// DTO for permission with enabled state for a role.
/// </summary>
public record RolePermissionDto(
    Guid Id,
    string Key,
    string Module,
    string Description,
    bool IsEnabled
);
