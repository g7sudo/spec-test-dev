using FluentValidation;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Announcements.Commands.UpdateAnnouncement;

/// <summary>
/// Validator for UpdateAnnouncementCommand.
/// </summary>
public class UpdateAnnouncementValidator : AbstractValidator<UpdateAnnouncementCommand>
{
    public UpdateAnnouncementValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Announcement ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Announcement title is required.")
            .MaximumLength(200).WithMessage("Announcement title cannot exceed 200 characters.");

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Announcement body is required.")
            .MaximumLength(10000).WithMessage("Announcement body cannot exceed 10000 characters.");

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Invalid announcement category.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid announcement priority.");

        RuleFor(x => x.Audiences)
            .NotEmpty().WithMessage("At least one audience target is required.");

        RuleForEach(x => x.Audiences).ChildRules(audience =>
        {
            audience.RuleFor(a => a.TargetType)
                .IsInEnum().WithMessage("Invalid audience target type.");

            audience.RuleFor(a => a.BlockId)
                .NotEmpty().WithMessage("Block ID is required for Block target type.")
                .When(a => a.TargetType == AudienceTargetType.Block);

            audience.RuleFor(a => a.UnitId)
                .NotEmpty().WithMessage("Unit ID is required for Unit target type.")
                .When(a => a.TargetType == AudienceTargetType.Unit);

            audience.RuleFor(a => a.RoleGroupId)
                .NotEmpty().WithMessage("Role Group ID is required for RoleGroup target type.")
                .When(a => a.TargetType == AudienceTargetType.RoleGroup);
        });

        When(x => x.IsEvent, () =>
        {
            RuleFor(x => x.EventStartAt)
                .NotNull().WithMessage("Event start date is required for event announcements.");

            RuleFor(x => x.EventEndAt)
                .GreaterThan(x => x.EventStartAt)
                .When(x => x.EventEndAt.HasValue && x.EventStartAt.HasValue)
                .WithMessage("Event end date must be after start date.");
        });

        RuleFor(x => x.EventLocationText)
            .MaximumLength(500).WithMessage("Event location cannot exceed 500 characters.")
            .When(x => x.IsEvent);

        RuleFor(x => x.EventJoinUrl)
            .MaximumLength(1000).WithMessage("Event join URL cannot exceed 1000 characters.")
            .When(x => x.IsEvent);
    }
}
