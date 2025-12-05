using FluentValidation;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.ResidentInvites.Commands.CreateResidentInvite;

/// <summary>
/// Validator for CreateResidentInviteCommand.
/// </summary>
public class CreateResidentInviteValidator : AbstractValidator<CreateResidentInviteCommand>
{
    public CreateResidentInviteValidator()
    {
        RuleFor(x => x.LeaseId)
            .NotEmpty()
            .WithMessage("Lease ID is required.");

        RuleFor(x => x.PartyId)
            .NotEmpty()
            .WithMessage("Party ID is required.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("Invalid email format.")
            .MaximumLength(255)
            .WithMessage("Email cannot exceed 255 characters.");

        RuleFor(x => x.Role)
            .IsInEnum()
            .WithMessage("Invalid role.")
            .Must(role => role == LeasePartyRole.PrimaryResident || role == LeasePartyRole.CoResident)
            .WithMessage("Only PrimaryResident or CoResident roles can be invited.");

        RuleFor(x => x.ExpirationDays)
            .GreaterThan(0)
            .WithMessage("Expiration days must be positive.")
            .LessThanOrEqualTo(30)
            .WithMessage("Expiration days cannot exceed 30.");
    }
}
