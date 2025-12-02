using FluentValidation;

namespace Savi.Application.Tenant.Community.Commands.UpdateUnitType;
public class UpdateUnitTypeValidator : AbstractValidator<UpdateUnitTypeCommand>
{
    public UpdateUnitTypeValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(64);
        RuleFor(x => x.Name)
            .MaximumLength(256);
        RuleFor(x => x.Description)
            .MaximumLength(1000);
        RuleFor(x => x.DefaultParkingSlots)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(10);
        RuleFor(x => x.DefaultOccupancyLimit)
            .GreaterThan(0)
            .When(x => x.DefaultOccupancyLimit.HasValue);
    }
}
