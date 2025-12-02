using FluentValidation;

namespace Savi.Application.Tenant.Community.Commands.CreateFloor;
/// <summary>
/// Validator for CreateFloorCommand.
/// </summary>
public class CreateFloorValidator : AbstractValidator<CreateFloorCommand>
{
    public CreateFloorValidator()
    {
        RuleFor(x => x.BlockId)
            .NotEmpty()
            .WithMessage("Block ID is required.");
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Floor name is required.")
            .MaximumLength(200)
            .WithMessage("Floor name cannot exceed 200 characters.");

        RuleFor(x => x.LevelNumber)
            .NotEmpty()
            .WithMessage("Level number is required.");
        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Display order must be 0 or greater.");
    }
}
