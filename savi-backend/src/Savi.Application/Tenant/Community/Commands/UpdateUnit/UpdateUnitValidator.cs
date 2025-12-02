using FluentValidation;
using Savi.Application.Tenant.Community.Commands.UpdateUnit;

namespace Savi.Application.Tenant.Community.Commands.UpdateUnit;
/// <summary>
/// Validator for UpdateUnitCommand.
/// </summary>
public class UpdateUnitValidator : AbstractValidator<UpdateUnitCommand>
{
    public UpdateUnitValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Unit ID is required.");
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
    }
}
