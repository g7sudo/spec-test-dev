using FluentValidation;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.AddMaintenanceRequestDetail;

/// <summary>
/// Validator for AddMaintenanceRequestDetailCommand.
/// </summary>
public class AddMaintenanceRequestDetailCommandValidator : AbstractValidator<AddMaintenanceRequestDetailCommand>
{
    public AddMaintenanceRequestDetailCommandValidator()
    {
        RuleFor(x => x.MaintenanceRequestId)
            .NotEmpty()
            .WithMessage("Maintenance request ID is required.");

        RuleFor(x => x.LineType)
            .IsInEnum()
            .WithMessage("Invalid line type value.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Quantity must be greater than 0.");

        RuleFor(x => x.UnitOfMeasure)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.UnitOfMeasure))
            .WithMessage("Unit of measure must not exceed 50 characters.");

        RuleFor(x => x.EstimatedUnitPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedUnitPrice.HasValue)
            .WithMessage("Estimated unit price must be non-negative.");
    }
}
