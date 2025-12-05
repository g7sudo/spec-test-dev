namespace Savi.Application.Tenant.Rbac.Dtos;

/// <summary>
/// DTO for community user with role group assignments.
/// </summary>
public record CommunityUserRbacDto(
    Guid Id,
    Guid PartyId,
    string? PartyName,
    string? PreferredName,
    Guid? PlatformUserId,
    DateTime CreatedAt,
    List<UserRoleGroupAssignmentDto> RoleGroups
);

/// <summary>
/// DTO for a user's role group assignment.
/// </summary>
public record UserRoleGroupAssignmentDto(
    Guid RoleGroupId,
    string RoleGroupCode,
    string RoleGroupName,
    bool IsPrimary,
    DateTime? ValidFrom,
    DateTime? ValidTo
);
