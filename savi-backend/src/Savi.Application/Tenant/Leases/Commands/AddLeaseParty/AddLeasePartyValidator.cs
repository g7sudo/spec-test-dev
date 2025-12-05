using FluentValidation;

namespace Savi.Application.Tenant.Leases.Commands.AddLeaseParty;

/// <summary>
/// Validator for AddLeasePartyCommand.
/// </summary>
public class AddLeasePartyValidator : AbstractValidator<AddLeasePartyCommand>
{
    public AddLeasePartyValidator()
    {
        RuleFor(x => x.LeaseId)
            .NotEmpty()
            .WithMessage("Lease ID is required.");

        RuleFor(x => x.PartyId)
            .NotEmpty()
            .WithMessage("Party ID is required.");

        RuleFor(x => x.Role)
            .IsInEnum()
            .WithMessage("Invalid role.");
    }
}
