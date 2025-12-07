using FluentValidation;
using Savi.Domain.Platform.Enums;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.AddStorySlide;

/// <summary>
/// Validator for AddStorySlideCommand.
/// </summary>
public sealed class AddStorySlideValidator : AbstractValidator<AddStorySlideCommand>
{
    public AddStorySlideValidator()
    {
        RuleFor(x => x.CampaignId)
            .NotEmpty().WithMessage("Campaign ID is required.");

        RuleFor(x => x.Request.MediaUrl)
            .NotEmpty().WithMessage("Media URL is required.")
            .MaximumLength(1000).WithMessage("Media URL must not exceed 1000 characters.");

        RuleFor(x => x.Request.Sequence)
            .GreaterThan(0).WithMessage("Sequence must be greater than 0.");

        RuleFor(x => x.Request.Caption)
            .MaximumLength(500).WithMessage("Caption must not exceed 500 characters.");

        RuleFor(x => x.Request.CTAType)
            .IsInEnum().WithMessage("Invalid CTA type.");

        RuleFor(x => x.Request.CTAValue)
            .NotEmpty()
            .When(x => x.Request.CTAType != CTAType.None)
            .WithMessage("CTA value is required when CTA type is specified.")
            .MaximumLength(500).WithMessage("CTA value must not exceed 500 characters.");
    }
}
