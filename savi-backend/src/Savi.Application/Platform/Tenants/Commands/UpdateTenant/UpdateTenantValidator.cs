using FluentValidation;

namespace Savi.Application.Platform.Tenants.Commands.UpdateTenant;

public class UpdateTenantValidator : AbstractValidator<UpdateTenantCommand>
{
    public UpdateTenantValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty()
            .WithMessage("Tenant ID is required.");

        RuleFor(x => x.Request.Name)
            .NotEmpty()
            .WithMessage("Tenant name is required.")
            .MaximumLength(200)
            .WithMessage("Tenant name cannot exceed 200 characters.");

        RuleFor(x => x.Request.Code)
            .MaximumLength(50)
            .WithMessage("Tenant code cannot exceed 50 characters.")
            .Matches("^[a-z0-9-]*$")
            .When(x => !string.IsNullOrEmpty(x.Request.Code))
            .WithMessage("Tenant code can only contain lowercase letters, numbers, and hyphens.");

        RuleFor(x => x.Request.PrimaryContactEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Request.PrimaryContactEmail))
            .WithMessage("Invalid email format.");

        RuleFor(x => x.Request.Timezone)
            .MaximumLength(100)
            .WithMessage("Timezone cannot exceed 100 characters.");
    }
}
