using FluentValidation;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenityBooking;

/// <summary>
/// Validator for CreateAmenityBookingCommand.
/// </summary>
public class CreateAmenityBookingValidator : AbstractValidator<CreateAmenityBookingCommand>
{
    public CreateAmenityBookingValidator()
    {
        RuleFor(x => x.AmenityId)
            .NotEmpty().WithMessage("Amenity ID is required.");

        RuleFor(x => x.UnitId)
            .NotEmpty().WithMessage("Unit ID is required.");

        RuleFor(x => x.StartAt)
            .NotEmpty().WithMessage("Start time is required.")
            .GreaterThan(DateTime.UtcNow).WithMessage("Start time must be in the future.");

        RuleFor(x => x.EndAt)
            .NotEmpty().WithMessage("End time is required.")
            .GreaterThan(x => x.StartAt).WithMessage("End time must be after start time.");

        RuleFor(x => x.Source)
            .IsInEnum().WithMessage("Invalid booking source.");

        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.")
            .When(x => x.Title != null);

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes cannot exceed 2000 characters.")
            .When(x => x.Notes != null);

        RuleFor(x => x.NumberOfGuests)
            .GreaterThanOrEqualTo(0).WithMessage("Number of guests cannot be negative.")
            .When(x => x.NumberOfGuests.HasValue);
    }
}
