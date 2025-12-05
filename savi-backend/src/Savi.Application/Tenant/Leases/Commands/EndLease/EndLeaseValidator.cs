using FluentValidation;

namespace Savi.Application.Tenant.Leases.Commands.EndLease;

/// <summary>
/// Validator for EndLeaseCommand.
/// </summary>
public class EndLeaseValidator : AbstractValidator<EndLeaseCommand>
{
    public EndLeaseValidator()
    {
        RuleFor(x => x.LeaseId)
            .NotEmpty()
            .WithMessage("Lease ID is required.");

        RuleFor(x => x.TerminationReason)
            .MaximumLength(1000)
            .When(x => x.TerminationReason != null)
            .WithMessage("Termination reason cannot exceed 1000 characters.");
    }
}
