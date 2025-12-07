using FluentValidation;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.CreateAdvertiser;

/// <summary>
/// Validator for CreateAdvertiserCommand.
/// </summary>
public sealed class CreateAdvertiserValidator : AbstractValidator<CreateAdvertiserCommand>
{
    public CreateAdvertiserValidator()
    {
        RuleFor(x => x.Request.Name)
            .NotEmpty().WithMessage("Advertiser name is required.")
            .MaximumLength(200).WithMessage("Advertiser name must not exceed 200 characters.");

        RuleFor(x => x.Request.ContactName)
            .MaximumLength(200).WithMessage("Contact name must not exceed 200 characters.");

        RuleFor(x => x.Request.ContactEmail)
            .MaximumLength(200).WithMessage("Contact email must not exceed 200 characters.")
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Request.ContactEmail))
            .WithMessage("Contact email must be a valid email address.");

        RuleFor(x => x.Request.ContactPhone)
            .MaximumLength(50).WithMessage("Contact phone must not exceed 50 characters.");
    }
}
