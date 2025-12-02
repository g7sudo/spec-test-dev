using FluentValidation;

namespace Savi.Application.Platform.Tenants.Commands.InviteTenantAdmin;

/// <summary>
/// Validator for InviteTenantAdminCommand.
/// </summary>
public class InviteTenantAdminValidator : AbstractValidator<InviteTenantAdminCommand>
{
    public InviteTenantAdminValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty()
            .WithMessage("Tenant ID is required.");

        RuleFor(x => x.Request.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("Email must be valid.")
            .MaximumLength(255)
            .WithMessage("Email cannot exceed 255 characters.");

        RuleFor(x => x.Request.FullName)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.Request.FullName))
            .WithMessage("Full name cannot exceed 200 characters.");
    }
}
