using FluentValidation;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.UpdateMaintenanceRequest;

/// <summary>
/// Validator for UpdateMaintenanceRequestCommand.
/// </summary>
public class UpdateMaintenanceRequestCommandValidator : AbstractValidator<UpdateMaintenanceRequestCommand>
{
    public UpdateMaintenanceRequestCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Request ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(200)
            .WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage("Category is required.");

        RuleFor(x => x.Priority)
            .IsInEnum()
            .WithMessage("Invalid priority value.");
    }
}
