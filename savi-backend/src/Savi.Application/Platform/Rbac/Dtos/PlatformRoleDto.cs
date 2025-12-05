namespace Savi.Application.Platform.Rbac.Dtos;

/// <summary>
/// DTO for platform role summary (list view).
/// </summary>
public record PlatformRoleDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsSystem,
    int PermissionCount,
    int UserCount
);

/// <summary>
/// DTO for platform role detail with permissions.
/// </summary>
public record PlatformRoleDetailDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsSystem,
    List<RolePermissionDto> Permissions
);

/// <summary>
/// DTO for user assigned to a role.
/// </summary>
public record RoleUserDto(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    DateTime CreatedAt
);
