using FluentValidation;
using Savi.Application.Tenant.Community.Commands.UpdateParkingSlot;

namespace Savi.Application.Tenant.Community.Commands.UpdateParkingSlot;
/// <summary>
/// Validator for UpdateParkingSlotCommand.
/// </summary>
public class UpdateParkingSlotValidator : AbstractValidator<UpdateParkingSlotCommand>
{
    public UpdateParkingSlotValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Parking slot ID is required.");
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("Parking slot code is required.")
            .MaximumLength(50)
            .WithMessage("Parking slot code cannot exceed 50 characters.");

        RuleFor(x => x.LevelLabel)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.LevelLabel))
            .WithMessage("Level label cannot exceed 50 characters.");
        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Notes cannot exceed 1000 characters.");
    }
}
