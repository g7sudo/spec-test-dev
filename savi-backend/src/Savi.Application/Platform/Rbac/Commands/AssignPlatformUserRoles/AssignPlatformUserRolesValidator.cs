using FluentValidation;

namespace Savi.Application.Platform.Rbac.Commands.AssignPlatformUserRoles;

/// <summary>
/// Validator for AssignPlatformUserRolesCommand.
/// </summary>
public class AssignPlatformUserRolesValidator
    : AbstractValidator<AssignPlatformUserRolesCommand>
{
    public AssignPlatformUserRolesValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.RoleIds)
            .NotNull()
            .WithMessage("Role IDs list cannot be null.");
    }
}
