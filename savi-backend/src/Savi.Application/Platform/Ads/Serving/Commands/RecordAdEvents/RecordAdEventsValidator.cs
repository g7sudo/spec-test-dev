using FluentValidation;

namespace Savi.Application.Platform.Ads.Serving.Commands.RecordAdEvents;

/// <summary>
/// Validator for RecordAdEventsCommand.
/// </summary>
public sealed class RecordAdEventsValidator : AbstractValidator<RecordAdEventsCommand>
{
    public RecordAdEventsValidator()
    {
        RuleFor(x => x.Request.Events)
            .NotEmpty().WithMessage("At least one event is required.")
            .Must(events => events.Count <= 100)
            .WithMessage("Maximum 100 events per request.");

        RuleForEach(x => x.Request.Events).ChildRules(events =>
        {
            events.RuleFor(e => e.CampaignId)
                .NotEmpty().WithMessage("Campaign ID is required.");

            events.RuleFor(e => e.CreativeId)
                .NotEmpty().WithMessage("Creative ID is required.");

            events.RuleFor(e => e.TenantId)
                .NotEmpty().WithMessage("Tenant ID is required.");

            events.RuleFor(e => e.EventType)
                .NotEmpty().WithMessage("Event type is required.")
                .Must(t => t == "View" || t == "Click")
                .WithMessage("Event type must be 'View' or 'Click'.");

            events.RuleFor(e => e.OccurredAt)
                .NotEmpty().WithMessage("Occurred at is required.")
                .LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5))
                .WithMessage("Event cannot be from the future.");
        });
    }
}
