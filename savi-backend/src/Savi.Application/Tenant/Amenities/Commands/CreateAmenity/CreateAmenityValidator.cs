using FluentValidation;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenity;

/// <summary>
/// Validator for CreateAmenityCommand.
/// </summary>
public class CreateAmenityValidator : AbstractValidator<CreateAmenityCommand>
{
    public CreateAmenityValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Amenity name is required.")
            .MaximumLength(200).WithMessage("Amenity name cannot exceed 200 characters.");

        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Code cannot exceed 50 characters.")
            .When(x => x.Code != null);

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid amenity type.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
            .When(x => x.Description != null);

        RuleFor(x => x.LocationText)
            .MaximumLength(500).WithMessage("Location text cannot exceed 500 characters.")
            .When(x => x.LocationText != null);

        RuleFor(x => x.SlotDurationMinutes)
            .GreaterThan(0).WithMessage("Slot duration must be positive.");

        RuleFor(x => x.CleanupBufferMinutes)
            .GreaterThanOrEqualTo(0).WithMessage("Cleanup buffer cannot be negative.");

        RuleFor(x => x.MaxDaysInAdvance)
            .GreaterThan(0).WithMessage("Max days in advance must be positive.");

        RuleFor(x => x.MaxActiveBookingsPerUnit)
            .GreaterThan(0).WithMessage("Max active bookings per unit must be positive.")
            .When(x => x.MaxActiveBookingsPerUnit.HasValue);

        RuleFor(x => x.MaxGuests)
            .GreaterThan(0).WithMessage("Max guests must be positive.")
            .When(x => x.MaxGuests.HasValue);

        RuleFor(x => x.DepositAmount)
            .GreaterThan(0).WithMessage("Deposit amount must be positive when deposit is required.")
            .When(x => x.DepositRequired);

        RuleFor(x => x.OpenTime)
            .LessThan(x => x.CloseTime)
            .WithMessage("Open time must be before close time.")
            .When(x => x.OpenTime.HasValue && x.CloseTime.HasValue);
    }
}
