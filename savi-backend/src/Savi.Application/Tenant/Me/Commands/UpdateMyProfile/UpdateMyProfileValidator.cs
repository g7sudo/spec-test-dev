using FluentValidation;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyProfile;

/// <summary>
/// Validator for UpdateMyProfileCommand.
/// </summary>
public class UpdateMyProfileValidator : AbstractValidator<UpdateMyProfileCommand>
{
    public UpdateMyProfileValidator()
    {
        RuleFor(x => x.DisplayName)
            .MaximumLength(200)
            .WithMessage("Display name cannot exceed 200 characters.");

        RuleFor(x => x.AboutMe)
            .MaximumLength(2000)
            .WithMessage("About me cannot exceed 2000 characters.");

        RuleFor(x => x.TempProfilePhoto)
            .NotEmpty()
            .When(x => !string.IsNullOrWhiteSpace(x.TempProfilePhoto))
            .WithMessage("Temp profile photo key cannot be empty.");

        // Ensure only one method is used at a time
        RuleFor(x => x)
            .Must(x => !(x.ProfilePhotoDocumentId.HasValue && !string.IsNullOrWhiteSpace(x.TempProfilePhoto)))
            .WithMessage("Cannot provide both ProfilePhotoDocumentId and TempProfilePhoto. Use one or the other.");
    }
}

