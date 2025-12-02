using FluentValidation;

namespace Savi.Application.Platform.Tenants.Commands.AcceptInvitation;

/// <summary>
/// Validator for AcceptInvitationCommand.
/// </summary>
public class AcceptInvitationValidator : AbstractValidator<AcceptInvitationCommand>
{
    public AcceptInvitationValidator()
    {
        RuleFor(x => x.Request.InvitationToken)
            .NotEmpty()
            .WithMessage("Invitation token is required.")
            .Length(64)
            .WithMessage("Invitation token must be 64 characters.");
    }
}
