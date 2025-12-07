using FluentValidation;

namespace Savi.Application.Tenant.Announcements.Commands.AddAnnouncementComment;

/// <summary>
/// Validator for AddAnnouncementCommentCommand.
/// </summary>
public class AddAnnouncementCommentValidator : AbstractValidator<AddAnnouncementCommentCommand>
{
    public AddAnnouncementCommentValidator()
    {
        RuleFor(x => x.AnnouncementId)
            .NotEmpty().WithMessage("Announcement ID is required.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Comment content is required.")
            .MaximumLength(2000).WithMessage("Comment cannot exceed 2000 characters.");
    }
}
