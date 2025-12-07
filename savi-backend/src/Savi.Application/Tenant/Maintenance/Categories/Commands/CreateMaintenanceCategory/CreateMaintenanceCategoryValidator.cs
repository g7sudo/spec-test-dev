using FluentValidation;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.CreateMaintenanceCategory;

/// <summary>
/// Validator for CreateMaintenanceCategoryCommand.
/// </summary>
public class CreateMaintenanceCategoryValidator : AbstractValidator<CreateMaintenanceCategoryCommand>
{
    public CreateMaintenanceCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(200).WithMessage("Category name cannot exceed 200 characters.");

        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Code cannot exceed 50 characters.")
            .When(x => x.Code != null);

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => x.Description != null);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative.");
    }
}
