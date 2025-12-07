using FluentValidation;

namespace Savi.Application.Platform.Notifications.Commands.BroadcastNotification;

/// <summary>
/// Validator for BroadcastNotificationCommand.
/// </summary>
public sealed class BroadcastNotificationValidator : AbstractValidator<BroadcastNotificationCommand>
{
    public BroadcastNotificationValidator()
    {
        RuleFor(x => x.Request.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(256).WithMessage("Title must not exceed 256 characters.");

        RuleFor(x => x.Request.Body)
            .NotEmpty().WithMessage("Body is required.")
            .MaximumLength(4000).WithMessage("Body must not exceed 4000 characters.");

        RuleFor(x => x.Request.Priority)
            .Must(p => string.IsNullOrEmpty(p) ||
                       p.Equals("Low", StringComparison.OrdinalIgnoreCase) ||
                       p.Equals("Normal", StringComparison.OrdinalIgnoreCase) ||
                       p.Equals("High", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Priority must be 'Low', 'Normal', or 'High'.");
    }
}
