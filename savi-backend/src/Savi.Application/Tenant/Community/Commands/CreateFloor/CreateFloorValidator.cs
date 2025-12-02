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

        RuleFor(x => x.TempDocuments)
            .Must(list => list == null || list.Count <= 10)
            .WithMessage("Cannot use more than 10 temp document keys.")
            .Must(list => list == null || list.All(key => !string.IsNullOrWhiteSpace(key)))
            .WithMessage("Temp document keys cannot be empty.");
    }
}
