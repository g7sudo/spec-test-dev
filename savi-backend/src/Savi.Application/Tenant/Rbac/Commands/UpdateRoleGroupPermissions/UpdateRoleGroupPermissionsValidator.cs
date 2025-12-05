using FluentValidation;

namespace Savi.Application.Tenant.Rbac.Commands.UpdateRoleGroupPermissions;

/// <summary>
/// Validator for UpdateRoleGroupPermissionsCommand.
/// </summary>
public class UpdateRoleGroupPermissionsValidator
    : AbstractValidator<UpdateRoleGroupPermissionsCommand>
{
    public UpdateRoleGroupPermissionsValidator()
    {
        RuleFor(x => x.RoleGroupId)
            .NotEmpty()
            .WithMessage("Role group ID is required.");

        RuleFor(x => x.PermissionKeys)
            .NotNull()
            .WithMessage("Permission keys list cannot be null.");
    }
}
