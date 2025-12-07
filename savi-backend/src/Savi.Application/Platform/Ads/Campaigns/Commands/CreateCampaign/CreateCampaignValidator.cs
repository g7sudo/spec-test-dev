using FluentValidation;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.CreateCampaign;

/// <summary>
/// Validator for CreateCampaignCommand.
/// </summary>
public sealed class CreateCampaignValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignValidator()
    {
        RuleFor(x => x.Request.AdvertiserId)
            .NotEmpty().WithMessage("Advertiser ID is required.");

        RuleFor(x => x.Request.Name)
            .NotEmpty().WithMessage("Campaign name is required.")
            .MaximumLength(200).WithMessage("Campaign name must not exceed 200 characters.");

        RuleFor(x => x.Request.Type)
            .IsInEnum().WithMessage("Invalid campaign type.");

        RuleFor(x => x.Request.StartsAt)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.Request.EndsAt)
            .GreaterThan(x => x.Request.StartsAt)
            .When(x => x.Request.EndsAt.HasValue)
            .WithMessage("End date must be after start date.");

        RuleFor(x => x.Request.MaxImpressions)
            .GreaterThan(0)
            .When(x => x.Request.MaxImpressions.HasValue)
            .WithMessage("Max impressions must be greater than 0.");

        RuleFor(x => x.Request.MaxClicks)
            .GreaterThan(0)
            .When(x => x.Request.MaxClicks.HasValue)
            .WithMessage("Max clicks must be greater than 0.");

        RuleFor(x => x.Request.DailyImpressionCap)
            .GreaterThan(0)
            .When(x => x.Request.DailyImpressionCap.HasValue)
            .WithMessage("Daily impression cap must be greater than 0.");

        RuleFor(x => x.Request.Priority)
            .GreaterThanOrEqualTo(0).WithMessage("Priority must be 0 or greater.");

        RuleFor(x => x.Request.TargetTenantIds)
            .NotEmpty().WithMessage("At least one target tenant is required.");
    }
}
