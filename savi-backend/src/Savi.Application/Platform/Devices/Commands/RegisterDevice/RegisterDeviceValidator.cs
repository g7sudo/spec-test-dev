using FluentValidation;

namespace Savi.Application.Platform.Devices.Commands.RegisterDevice;

/// <summary>
/// Validator for RegisterDeviceCommand.
/// </summary>
public sealed class RegisterDeviceValidator : AbstractValidator<RegisterDeviceCommand>
{
    public RegisterDeviceValidator()
    {
        RuleFor(x => x.Request.DeviceToken)
            .NotEmpty().WithMessage("Device token is required.")
            .MaximumLength(500).WithMessage("Device token must not exceed 500 characters.");

        RuleFor(x => x.Request.DeviceId)
            .NotEmpty().WithMessage("Device ID is required.")
            .MaximumLength(256).WithMessage("Device ID must not exceed 256 characters.");

        RuleFor(x => x.Request.Platform)
            .NotEmpty().WithMessage("Platform is required.")
            .Must(p => p.Equals("iOS", StringComparison.OrdinalIgnoreCase) ||
                       p.Equals("Android", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Platform must be 'iOS' or 'Android'.");

        RuleFor(x => x.Request.DeviceName)
            .MaximumLength(200).WithMessage("Device name must not exceed 200 characters.");

        RuleFor(x => x.Request.AppVersion)
            .MaximumLength(50).WithMessage("App version must not exceed 50 characters.");

        RuleFor(x => x.Request.OsVersion)
            .MaximumLength(50).WithMessage("OS version must not exceed 50 characters.");
    }
}
