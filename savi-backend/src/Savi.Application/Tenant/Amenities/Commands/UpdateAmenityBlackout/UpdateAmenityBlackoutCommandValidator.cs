using FluentValidation;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateAmenityBlackout;

/// <summary>
/// Validator for UpdateAmenityBlackoutCommand.
/// </summary>
public class UpdateAmenityBlackoutCommandValidator : AbstractValidator<UpdateAmenityBlackoutCommand>
{
    public UpdateAmenityBlackoutCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Blackout ID is required.");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Start date is required.")
            .LessThanOrEqualTo(x => x.EndDate)
            .WithMessage("Start date must be before or equal to end date.");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("End date is required.")
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be after or equal to start date.");

        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Reason cannot exceed 500 characters.")
            .When(x => x.Reason != null);
    }
}
