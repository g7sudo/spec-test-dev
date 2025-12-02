using FluentValidation;
using Savi.Application.Tenant.Community.Commands.CreateUnit;

namespace Savi.Application.Tenant.Community.Commands.CreateUnit;
/// <summary>
/// Validator for CreateUnitCommand.
/// </summary>
public class CreateUnitValidator : AbstractValidator<CreateUnitCommand>
{
    public CreateUnitValidator()
    {
        RuleFor(x => x.BlockId)
            .NotEmpty()
            .WithMessage("Block ID is required.");
        RuleFor(x => x.FloorId)
            .NotEmpty()
            .WithMessage("Floor ID is required.");

        RuleFor(x => x.UnitTypeId)
            .NotEmpty()
            .WithMessage("Unit type ID is required.");

        RuleFor(x => x.UnitNumber)
            .NotEmpty()
            .WithMessage("Unit number is required.")
            .MaximumLength(50)
            .WithMessage("Unit number cannot exceed 50 characters.");
        RuleFor(x => x.AreaSqft)
            .GreaterThan(0)
            .When(x => x.AreaSqft.HasValue)
            .WithMessage("Area must be greater than 0 if provided.");
        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Notes cannot exceed 1000 characters.");

        RuleFor(x => x.TempDocuments)
            .Must(list => list == null || list.Count <= 10)
            .WithMessage("Cannot use more than 10 temp document keys.")
            .Must(list => list == null || list.All(key => !string.IsNullOrWhiteSpace(key)))
            .WithMessage("Temp document keys cannot be empty.");
    }
}
