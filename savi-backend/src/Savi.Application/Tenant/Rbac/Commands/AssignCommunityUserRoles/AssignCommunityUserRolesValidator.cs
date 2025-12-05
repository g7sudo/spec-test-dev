using FluentValidation;

namespace Savi.Application.Tenant.Rbac.Commands.AssignCommunityUserRoles;

/// <summary>
/// Validator for AssignCommunityUserRolesCommand.
/// </summary>
public class AssignCommunityUserRolesValidator
    : AbstractValidator<AssignCommunityUserRolesCommand>
{
    public AssignCommunityUserRolesValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.RoleGroups)
            .NotNull()
            .WithMessage("Role groups list cannot be null.");
    }
}
