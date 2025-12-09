using FluentValidation;

namespace Savi.Application.Tenant.Rbac.Commands.CreateRoleGroup;

/// <summary>
/// Validator for CreateRoleGroupCommand.
/// </summary>
public class CreateRoleGroupValidator : AbstractValidator<CreateRoleGroupCommand>
{
    public CreateRoleGroupValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Role name is required.")
            .MaximumLength(100).WithMessage("Role name cannot exceed 100 characters.");

        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Code cannot exceed 50 characters.")
            .Matches(@"^[A-Za-z0-9_]*$").WithMessage("Code can only contain letters, numbers, and underscores.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.GroupType)
            .IsInEnum().WithMessage("Invalid group type.");
    }
}

