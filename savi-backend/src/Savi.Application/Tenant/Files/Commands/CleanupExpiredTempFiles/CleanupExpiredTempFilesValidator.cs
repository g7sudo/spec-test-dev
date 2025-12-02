using FluentValidation;

namespace Savi.Application.Tenant.Files.Commands.CleanupExpiredTempFiles;

/// <summary>
/// Validator for CleanupExpiredTempFilesCommand.
/// </summary>
public class CleanupExpiredTempFilesValidator : AbstractValidator<CleanupExpiredTempFilesCommand>
{
    public CleanupExpiredTempFilesValidator()
    {
        RuleFor(x => x.DaysOld)
            .GreaterThanOrEqualTo(1)
            .WithMessage("DaysOld must be at least 1.")
            .LessThanOrEqualTo(365)
            .WithMessage("DaysOld cannot exceed 365 days.");
    }
}
