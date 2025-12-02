using FluentValidation;

namespace Savi.Application.Tenant.Files.Commands.UploadPermanentFile;

/// <summary>
/// Validator for UploadPermanentFileCommand.
/// </summary>
public class UploadPermanentFileValidator : AbstractValidator<UploadPermanentFileCommand>
{
    public UploadPermanentFileValidator()
    {
        RuleFor(x => x.OwnerType)
            .IsInEnum()
            .WithMessage("Invalid owner type.");

        RuleFor(x => x.OwnerId)
            .NotEmpty()
            .WithMessage("Owner ID is required.");

        RuleFor(x => x.Category)
            .IsInEnum()
            .WithMessage("Invalid document category.");

        RuleFor(x => x.File)
            .NotNull()
            .WithMessage("File is required.");

        RuleFor(x => x.File.Length)
            .GreaterThan(0)
            .WithMessage("File cannot be empty.")
            .When(x => x.File != null);

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
