using FluentValidation;

namespace Savi.Application.Tenant.Residents.Commands.MoveOutResident;

/// <summary>
/// Validator for MoveOutResidentCommand.
/// </summary>
public class MoveOutResidentValidator : AbstractValidator<MoveOutResidentCommand>
{
    public MoveOutResidentValidator()
    {
        RuleFor(x => x.LeasePartyId)
            .NotEmpty()
            .WithMessage("Lease party ID is required.");

        RuleFor(x => x.MoveOutDate)
            .NotEmpty()
            .WithMessage("Move-out date is required.");
    }
}
