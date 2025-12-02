using FluentValidation;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyPrivacySettings;

/// <summary>
/// Validator for UpdateMyPrivacySettingsCommand.
/// </summary>
public class UpdateMyPrivacySettingsValidator : AbstractValidator<UpdateMyPrivacySettingsCommand>
{
    public UpdateMyPrivacySettingsValidator()
    {
        RuleFor(x => x.DirectoryVisibility)
            .IsInEnum()
            .WithMessage("Directory visibility must be a valid value.");
    }
}

