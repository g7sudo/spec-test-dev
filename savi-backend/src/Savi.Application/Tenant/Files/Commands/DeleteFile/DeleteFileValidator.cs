using FluentValidation;

namespace Savi.Application.Tenant.Files.Commands.DeleteFile;

/// <summary>
/// Validator for DeleteFileCommand.
/// </summary>
public class DeleteFileValidator : AbstractValidator<DeleteFileCommand>
{
    public DeleteFileValidator()
    {
        RuleFor(x => x.DocumentId)
            .NotEmpty()
            .WithMessage("Document ID is required.");
    }
}
