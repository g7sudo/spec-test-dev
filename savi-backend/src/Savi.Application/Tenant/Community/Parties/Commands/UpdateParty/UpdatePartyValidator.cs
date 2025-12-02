using FluentValidation;

namespace Savi.Application.Tenant.Community.Parties.Commands.UpdateParty;

/// <summary>
/// Validator for UpdatePartyCommand.
/// </summary>
public class UpdatePartyValidator : AbstractValidator<UpdatePartyCommand>
{
    public UpdatePartyValidator()
    {
        // ID is required
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Party ID is required.");

        // Party name is always required
        RuleFor(x => x.PartyName)
            .NotEmpty()
            .WithMessage("Party name is required.")
            .MaximumLength(500)
            .WithMessage("Party name cannot exceed 500 characters.");

        // Legal name validation (optional but limited length)
        RuleFor(x => x.LegalName)
            .MaximumLength(500)
            .WithMessage("Legal name cannot exceed 500 characters.");

        // First/Last name validation (for individuals)
        RuleFor(x => x.FirstName)
            .MaximumLength(200)
            .WithMessage("First name cannot exceed 200 characters.");

        RuleFor(x => x.LastName)
            .MaximumLength(200)
            .WithMessage("Last name cannot exceed 200 characters.");

        // Date of birth validation
        RuleFor(x => x.DateOfBirth)
            .LessThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .When(x => x.DateOfBirth.HasValue)
            .WithMessage("Date of birth cannot be in the future.");

        // Company-specific validation
        RuleFor(x => x.RegistrationNumber)
            .MaximumLength(100)
            .WithMessage("Registration number cannot exceed 100 characters.");

        RuleFor(x => x.TaxNumber)
            .MaximumLength(100)
            .WithMessage("Tax number cannot exceed 100 characters.");

        // Notes validation
        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .WithMessage("Notes cannot exceed 2000 characters.");
    }
}

