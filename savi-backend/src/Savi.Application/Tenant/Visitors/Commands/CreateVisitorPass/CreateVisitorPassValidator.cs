using FluentValidation;

namespace Savi.Application.Tenant.Visitors.Commands.CreateVisitorPass;

/// <summary>
/// Validator for CreateVisitorPassCommand.
/// </summary>
public class CreateVisitorPassValidator : AbstractValidator<CreateVisitorPassCommand>
{
    public CreateVisitorPassValidator()
    {
        RuleFor(x => x.UnitId)
            .NotEmpty()
            .WithMessage("Unit ID is required.");

        RuleFor(x => x.VisitorName)
            .NotEmpty()
            .WithMessage("Visitor name is required.")
            .MaximumLength(200)
            .WithMessage("Visitor name must not exceed 200 characters.");

        RuleFor(x => x.VisitType)
            .IsInEnum()
            .WithMessage("Invalid visit type.");

        RuleFor(x => x.VisitorPhone)
            .MaximumLength(50)
            .WithMessage("Visitor phone must not exceed 50 characters.");

        RuleFor(x => x.VehicleNumber)
            .MaximumLength(50)
            .WithMessage("Vehicle number must not exceed 50 characters.");

        RuleFor(x => x.VehicleType)
            .MaximumLength(50)
            .WithMessage("Vehicle type must not exceed 50 characters.");

        RuleFor(x => x.DeliveryProvider)
            .MaximumLength(100)
            .WithMessage("Delivery provider must not exceed 100 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .WithMessage("Notes must not exceed 1000 characters.");

        RuleFor(x => x.ExpectedTo)
            .GreaterThan(x => x.ExpectedFrom)
            .When(x => x.ExpectedFrom.HasValue && x.ExpectedTo.HasValue)
            .WithMessage("Expected end time must be after expected start time.");
    }
}
