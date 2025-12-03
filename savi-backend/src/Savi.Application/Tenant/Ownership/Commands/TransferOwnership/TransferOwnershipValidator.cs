using FluentValidation;

namespace Savi.Application.Tenant.Ownership.Commands.TransferOwnership;

/// <summary>
/// Validator for TransferOwnershipCommand.
/// </summary>
public class TransferOwnershipValidator : AbstractValidator<TransferOwnershipCommand>
{
    public TransferOwnershipValidator()
    {
        RuleFor(x => x.UnitId)
            .NotEmpty()
            .WithMessage("Unit ID is required.");

        RuleFor(x => x.TransferDate)
            .NotEmpty()
            .WithMessage("Transfer date is required.");

        RuleFor(x => x.NewOwners)
            .NotEmpty()
            .WithMessage("At least one new owner is required.");

        RuleForEach(x => x.NewOwners)
            .ChildRules(owner =>
            {
                owner.RuleFor(o => o.PartyId)
                    .NotEmpty()
                    .WithMessage("Party ID is required for each owner.");

                owner.RuleFor(o => o.OwnershipShare)
                    .GreaterThan(0)
                    .WithMessage("Ownership share must be greater than 0.")
                    .LessThanOrEqualTo(100)
                    .WithMessage("Ownership share cannot exceed 100%.");
            });
    }
}
