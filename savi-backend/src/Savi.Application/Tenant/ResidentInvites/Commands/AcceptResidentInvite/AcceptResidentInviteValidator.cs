using FluentValidation;

namespace Savi.Application.Tenant.ResidentInvites.Commands.AcceptResidentInvite;

/// <summary>
/// Validator for AcceptResidentInviteCommand.
/// </summary>
public class AcceptResidentInviteValidator : AbstractValidator<AcceptResidentInviteCommand>
{
    public AcceptResidentInviteValidator()
    {
        RuleFor(x => x.InviteId)
            .NotEmpty()
            .WithMessage("Invite ID is required.");

        RuleFor(x => x.InvitationToken)
            .NotEmpty()
            .WithMessage("Invitation token is required.");
    }
}
