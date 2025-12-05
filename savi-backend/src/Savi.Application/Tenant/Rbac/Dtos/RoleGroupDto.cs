using Savi.Domain.Tenant;

namespace Savi.Application.Tenant.Rbac.Dtos;

/// <summary>
/// DTO for role group summary (list view).
/// </summary>
public record RoleGroupDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    RoleGroupType GroupType,
    bool IsSystem,
    int DisplayOrder,
    int PermissionCount,
    int UserCount
);

/// <summary>
/// DTO for role group detail with permissions.
/// </summary>
public record RoleGroupDetailDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    RoleGroupType GroupType,
    bool IsSystem,
    int DisplayOrder,
    List<RoleGroupPermissionDto> Permissions
);

/// <summary>
/// DTO for user assigned to a role group.
/// </summary>
public record RoleGroupUserDto(
    Guid Id,
    string? PreferredName,
    Guid? PartyId,
    string? PartyName,
    bool IsPrimary,
    DateTime? ValidFrom,
    DateTime? ValidTo,
    DateTime CreatedAt
);
