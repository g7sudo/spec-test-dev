using FluentValidation;

namespace Savi.Application.Tenant.Community.Commands.CreateBlock;
/// <summary>
/// Validator for CreateBlockCommand.
/// </summary>
public class CreateBlockValidator : AbstractValidator<CreateBlockCommand>
{
    public CreateBlockValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Block name is required.")
            .MaximumLength(200)
            .WithMessage("Block name cannot exceed 200 characters.");
        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrWhiteSpace(x.Description))
            .WithMessage("Description cannot exceed 1000 characters.");
        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Display order must be 0 or greater.");

        RuleFor(x => x.TempDocuments)
            .Must(list => list == null || list.Count <= 10)
            .WithMessage("Cannot use more than 10 temp document keys.")
            .Must(list => list == null || list.All(key => !string.IsNullOrWhiteSpace(key)))
            .WithMessage("Temp document keys cannot be empty.");
    }
}
