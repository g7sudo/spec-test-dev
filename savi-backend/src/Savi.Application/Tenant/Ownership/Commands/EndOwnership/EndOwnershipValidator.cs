using FluentValidation;

namespace Savi.Application.Tenant.Ownership.Commands.EndOwnership;

/// <summary>
/// Validator for EndOwnershipCommand.
/// </summary>
public class EndOwnershipValidator : AbstractValidator<EndOwnershipCommand>
{
    public EndOwnershipValidator()
    {
        RuleFor(x => x.OwnershipId)
            .NotEmpty()
            .WithMessage("Ownership ID is required.");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("End date is required.");
    }
}
