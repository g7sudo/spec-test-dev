namespace Savi.Application.Platform.Rbac.Dtos;

/// <summary>
/// DTO for platform user with role assignments.
/// </summary>
public record PlatformUserRbacDto(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    DateTime CreatedAt,
    List<UserRoleAssignmentDto> Roles
);

/// <summary>
/// DTO for a user's role assignment.
/// </summary>
public record UserRoleAssignmentDto(
    Guid RoleId,
    string RoleCode,
    string RoleName
);
