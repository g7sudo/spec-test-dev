using FluentValidation;

namespace Savi.Application.Tenant.ResidentInvites.Commands.CancelResidentInvite;

/// <summary>
/// Validator for CancelResidentInviteCommand.
/// </summary>
public class CancelResidentInviteValidator : AbstractValidator<CancelResidentInviteCommand>
{
    public CancelResidentInviteValidator()
    {
        RuleFor(x => x.InviteId)
            .NotEmpty()
            .WithMessage("Invite ID is required.");
    }
}
