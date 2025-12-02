using FluentValidation;

namespace Savi.Application.Platform.Tenants.Commands.CreateTenant;

/// <summary>
/// Validator for CreateTenantCommand.
/// </summary>
public class CreateTenantValidator : AbstractValidator<CreateTenantCommand>
{
    public CreateTenantValidator()
    {
        RuleFor(x => x.Request.Name)
            .NotEmpty()
            .WithMessage("Tenant name is required.")
            .MaximumLength(200)
            .WithMessage("Tenant name cannot exceed 200 characters.");

        RuleFor(x => x.Request.Code)
            .MaximumLength(32)
            .When(x => !string.IsNullOrWhiteSpace(x.Request.Code))
            .WithMessage("Tenant code cannot exceed 32 characters.");

        RuleFor(x => x.Request.PrimaryContactEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Request.PrimaryContactEmail))
            .WithMessage("Primary contact email must be valid.");

        RuleFor(x => x.Request.PostalCode)
            .MaximumLength(20)
            .When(x => !string.IsNullOrWhiteSpace(x.Request.PostalCode))
            .WithMessage("Postal code cannot exceed 20 characters.");
    }
}
