using FluentValidation;

namespace Savi.Application.Tenant.Ownership.Commands.CreateUnitOwnership;

/// <summary>
/// Validator for CreateUnitOwnershipCommand.
/// </summary>
public class CreateUnitOwnershipValidator : AbstractValidator<CreateUnitOwnershipCommand>
{
    public CreateUnitOwnershipValidator()
    {
        RuleFor(x => x.UnitId)
            .NotEmpty()
            .WithMessage("Unit ID is required.");

        RuleFor(x => x.PartyId)
            .NotEmpty()
            .WithMessage("Party ID is required.");

        RuleFor(x => x.OwnershipShare)
            .GreaterThan(0)
            .WithMessage("Ownership share must be greater than 0.")
            .LessThanOrEqualTo(100)
            .WithMessage("Ownership share cannot exceed 100%.");

        RuleFor(x => x.FromDate)
            .NotEmpty()
            .WithMessage("From date is required.");
    }
}
