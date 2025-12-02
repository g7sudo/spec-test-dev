using FluentValidation;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Parties.Commands.CreateParty;

/// <summary>
/// Validator for CreatePartyCommand.
/// </summary>
public class CreatePartyValidator : AbstractValidator<CreatePartyCommand>
{
    public CreatePartyValidator()
    {
        // Party type is required
        RuleFor(x => x.PartyType)
            .IsInEnum()
            .WithMessage("Party type must be a valid value.");

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

        // Individual-specific validation
        When(x => x.PartyType == PartyType.Individual, () =>
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("First name is required for individuals.")
                .MaximumLength(200)
                .WithMessage("First name cannot exceed 200 characters.");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .WithMessage("Last name is required for individuals.")
                .MaximumLength(200)
                .WithMessage("Last name cannot exceed 200 characters.");

            RuleFor(x => x.DateOfBirth)
                .LessThan(DateOnly.FromDateTime(DateTime.UtcNow))
                .When(x => x.DateOfBirth.HasValue)
                .WithMessage("Date of birth cannot be in the future.");
        });

        // Company/Entity-specific validation
        When(x => x.PartyType == PartyType.Company || x.PartyType == PartyType.Entity, () =>
        {
            RuleFor(x => x.RegistrationNumber)
                .MaximumLength(100)
                .WithMessage("Registration number cannot exceed 100 characters.");

            RuleFor(x => x.TaxNumber)
                .MaximumLength(100)
                .WithMessage("Tax number cannot exceed 100 characters.");
        });

        // Notes validation
        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .WithMessage("Notes cannot exceed 2000 characters.");
    }
}

