using FluentValidation;

namespace Savi.Application.Tenant.Announcements.Commands.PublishAnnouncement;

/// <summary>
/// Validator for PublishAnnouncementCommand.
/// </summary>
public class PublishAnnouncementCommandValidator : AbstractValidator<PublishAnnouncementCommand>
{
    public PublishAnnouncementCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Announcement ID is required.");

        RuleFor(x => x.ScheduledAt)
            .GreaterThan(DateTime.UtcNow)
            .When(x => !x.PublishImmediately && x.ScheduledAt.HasValue)
            .WithMessage("Scheduled date must be in the future.");

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.ScheduledAt)
            .When(x => x.ExpiresAt.HasValue && x.ScheduledAt.HasValue)
            .WithMessage("Expiry date must be after scheduled date.");

        RuleFor(x => x)
            .Must(x => x.PublishImmediately || x.ScheduledAt.HasValue)
            .WithMessage("Either publish immediately or provide a scheduled date.");
    }
}
