using FluentValidation;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Parties.Commands.AddPartyContact;

/// <summary>
/// Validator for AddPartyContactCommand.
/// </summary>
public class AddPartyContactValidator : AbstractValidator<AddPartyContactCommand>
{
    public AddPartyContactValidator()
    {
        RuleFor(x => x.PartyId)
            .NotEmpty()
            .WithMessage("Party ID is required.");

        RuleFor(x => x.ContactType)
            .IsInEnum()
            .WithMessage("Contact type must be a valid value.");

        RuleFor(x => x.Value)
            .NotEmpty()
            .WithMessage("Contact value is required.")
            .MaximumLength(500)
            .WithMessage("Contact value cannot exceed 500 characters.");

        // Email validation when contact type is Email
        When(x => x.ContactType == PartyContactType.Email, () =>
        {
            RuleFor(x => x.Value)
                .EmailAddress()
                .WithMessage("Please provide a valid email address.");
        });

        // Phone number basic validation for mobile/phone types
        When(x => x.ContactType == PartyContactType.Mobile ||
                  x.ContactType == PartyContactType.Phone ||
                  x.ContactType == PartyContactType.Whatsapp, () =>
        {
            RuleFor(x => x.Value)
                .Matches(@"^[\d\s\+\-\(\)]+$")
                .WithMessage("Please provide a valid phone number.");
        });
    }
}

