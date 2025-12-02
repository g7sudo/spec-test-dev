using FluentValidation;

namespace Savi.Application.Tenant.Community.Parties.Commands.AddPartyAddress;

/// <summary>
/// Validator for AddPartyAddressCommand.
/// </summary>
public class AddPartyAddressValidator : AbstractValidator<AddPartyAddressCommand>
{
    public AddPartyAddressValidator()
    {
        RuleFor(x => x.PartyId)
            .NotEmpty()
            .WithMessage("Party ID is required.");

        RuleFor(x => x.AddressType)
            .IsInEnum()
            .WithMessage("Address type must be a valid value.");

        RuleFor(x => x.Line1)
            .NotEmpty()
            .WithMessage("Address line 1 is required.")
            .MaximumLength(500)
            .WithMessage("Address line 1 cannot exceed 500 characters.");

        RuleFor(x => x.Line2)
            .MaximumLength(500)
            .WithMessage("Address line 2 cannot exceed 500 characters.");

        RuleFor(x => x.City)
            .MaximumLength(200)
            .WithMessage("City cannot exceed 200 characters.");

        RuleFor(x => x.State)
            .MaximumLength(200)
            .WithMessage("State cannot exceed 200 characters.");

        RuleFor(x => x.Country)
            .MaximumLength(200)
            .WithMessage("Country cannot exceed 200 characters.");

        RuleFor(x => x.PostalCode)
            .MaximumLength(50)
            .WithMessage("Postal code cannot exceed 50 characters.");
    }
}

