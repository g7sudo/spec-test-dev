using FluentValidation;

namespace Savi.Application.Tenant.Community.Commands.UpdateBlock;
/// <summary>
/// Validator for UpdateBlockCommand.
/// </summary>
public class UpdateBlockValidator : AbstractValidator<UpdateBlockCommand>
{
    public UpdateBlockValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Block ID is required.");
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
    }
}
