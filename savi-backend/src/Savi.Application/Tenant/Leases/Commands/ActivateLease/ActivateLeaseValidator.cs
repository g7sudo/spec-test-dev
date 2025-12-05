using FluentValidation;

namespace Savi.Application.Tenant.Leases.Commands.ActivateLease;

/// <summary>
/// Validator for ActivateLeaseCommand.
/// </summary>
public class ActivateLeaseValidator : AbstractValidator<ActivateLeaseCommand>
{
    public ActivateLeaseValidator()
    {
        RuleFor(x => x.LeaseId)
            .NotEmpty()
            .WithMessage("Lease ID is required.");
    }
}
