using FluentValidation;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Leases.Commands.CreateLease;

/// <summary>
/// Validator for CreateLeaseCommand.
/// </summary>
public class CreateLeaseValidator : AbstractValidator<CreateLeaseCommand>
{
    public CreateLeaseValidator()
    {
        RuleFor(x => x.UnitId)
            .NotEmpty()
            .WithMessage("Unit ID is required.");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .Must((command, endDate) => !endDate.HasValue || endDate.Value >= command.StartDate)
            .WithMessage("End date cannot be before start date.");

        RuleFor(x => x.MonthlyRent)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MonthlyRent.HasValue)
            .WithMessage("Monthly rent cannot be negative.");

        RuleFor(x => x.DepositAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DepositAmount.HasValue)
            .WithMessage("Deposit amount cannot be negative.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .When(x => x.Notes != null)
            .WithMessage("Notes cannot exceed 2000 characters.");

        RuleForEach(x => x.Parties)
            .ChildRules(party =>
            {
                party.RuleFor(p => p.PartyId)
                    .NotEmpty()
                    .WithMessage("Party ID is required.");

                party.RuleFor(p => p.Role)
                    .IsInEnum()
                    .WithMessage("Invalid role.");
            })
            .When(x => x.Parties != null);
    }
}
