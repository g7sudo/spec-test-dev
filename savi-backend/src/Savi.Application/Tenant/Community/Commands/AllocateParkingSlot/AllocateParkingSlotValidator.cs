using FluentValidation;
using Savi.Application.Tenant.Community.Commands.AllocateParkingSlot;

namespace Savi.Application.Tenant.Community.Commands.AllocateParkingSlot;
/// <summary>
/// Validator for AllocateParkingSlotCommand.
/// </summary>
public class AllocateParkingSlotValidator : AbstractValidator<AllocateParkingSlotCommand>
{
    public AllocateParkingSlotValidator()
    {
        RuleFor(x => x.ParkingSlotId)
            .NotEmpty()
            .WithMessage("Parking slot ID is required.");
        RuleFor(x => x.UnitId)
            .NotEmpty()
            .WithMessage("Unit ID is required.");
    }
}
