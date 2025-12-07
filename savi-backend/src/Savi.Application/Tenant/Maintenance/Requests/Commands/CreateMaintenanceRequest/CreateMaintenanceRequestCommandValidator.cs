using FluentValidation;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.CreateMaintenanceRequest;

/// <summary>
/// Validator for CreateMaintenanceRequestCommand.
/// </summary>
public class CreateMaintenanceRequestCommandValidator : AbstractValidator<CreateMaintenanceRequestCommand>
{
    public CreateMaintenanceRequestCommandValidator()
    {
        RuleFor(x => x.UnitId)
            .NotEmpty()
            .WithMessage("Unit is required.");

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage("Category is required.");

        RuleFor(x => x.RequestedForPartyId)
            .NotEmpty()
            .WithMessage("Requested for party is required.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(200)
            .WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.Priority)
            .IsInEnum()
            .WithMessage("Invalid priority value.");

        RuleFor(x => x.Source)
            .IsInEnum()
            .WithMessage("Invalid source value.");

        RuleFor(x => x.DueBy)
            .GreaterThan(DateTime.UtcNow)
            .When(x => x.DueBy.HasValue)
            .WithMessage("Due date must be in the future.");
    }
}
