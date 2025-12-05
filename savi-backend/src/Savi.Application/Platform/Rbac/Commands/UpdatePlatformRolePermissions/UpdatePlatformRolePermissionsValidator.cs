using FluentValidation;

namespace Savi.Application.Platform.Rbac.Commands.UpdatePlatformRolePermissions;

/// <summary>
/// Validator for UpdatePlatformRolePermissionsCommand.
/// </summary>
public class UpdatePlatformRolePermissionsValidator
    : AbstractValidator<UpdatePlatformRolePermissionsCommand>
{
    public UpdatePlatformRolePermissionsValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty()
            .WithMessage("Role ID is required.");

        RuleFor(x => x.PermissionIds)
            .NotNull()
            .WithMessage("Permission IDs list cannot be null.");
    }
}
