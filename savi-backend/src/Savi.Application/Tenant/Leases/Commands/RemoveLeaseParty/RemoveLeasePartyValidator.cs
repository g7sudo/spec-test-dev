using FluentValidation;

namespace Savi.Application.Tenant.Leases.Commands.RemoveLeaseParty;

/// <summary>
/// Validator for RemoveLeasePartyCommand.
/// </summary>
public class RemoveLeasePartyValidator : AbstractValidator<RemoveLeasePartyCommand>
{
    public RemoveLeasePartyValidator()
    {
        RuleFor(x => x.LeasePartyId)
            .NotEmpty()
            .WithMessage("Lease party ID is required.");
    }
}
