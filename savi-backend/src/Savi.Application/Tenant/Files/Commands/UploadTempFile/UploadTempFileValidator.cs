using FluentValidation;

namespace Savi.Application.Tenant.Files.Commands.UploadTempFile;

/// <summary>
/// Validator for UploadTempFileCommand.
/// </summary>
public class UploadTempFileValidator : AbstractValidator<UploadTempFileCommand>
{
    public UploadTempFileValidator()
    {
        RuleFor(x => x.TempKey)
            .NotEmpty()
            .WithMessage("TempKey is required.");

        RuleFor(x => x.File)
            .NotNull()
            .WithMessage("File is required.");

        RuleFor(x => x.File.Length)
            .GreaterThan(0)
            .WithMessage("File cannot be empty.")
            .When(x => x.File != null);

        RuleFor(x => x.File.FileName)
            .NotEmpty()
            .WithMessage("File name is required.")
            .When(x => x.File != null);
    }
}
