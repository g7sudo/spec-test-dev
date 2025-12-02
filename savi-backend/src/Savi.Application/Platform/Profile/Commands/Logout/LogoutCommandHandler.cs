using MediatR;
using Microsoft.Extensions.Logging;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Profile.Commands.Logout;

/// <summary>
/// Handler for LogoutCommand.
/// 
/// Records an audit entry for user logout.
/// Future enhancements:
/// - Store in AuditLog table
/// - Track device/browser info
/// - Notify security monitoring
/// </summary>
public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result>
{
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<LogoutCommandHandler> _logger;

    public LogoutCommandHandler(
        ICurrentUser currentUser,
        ILogger<LogoutCommandHandler> logger)
    {
        _currentUser = currentUser;
        _logger = logger;
    }

    public Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        // ─────────────────────────────────────────────────────────────────
        // Record logout in audit log
        // For now, we just log it. Future: persist to AuditLog table.
        // ─────────────────────────────────────────────────────────────────
        _logger.LogInformation(
            "User logout recorded. UserId: {UserId}, Email: {Email}, TenantContext: {TenantId}, Timestamp: {Timestamp}",
            _currentUser.UserId,
            _currentUser.Email,
            _currentUser.CurrentTenantId,
            DateTime.UtcNow);

        // TODO: Future enhancements
        // - Insert into AuditLog table with action = "USER_LOGOUT"
        // - Capture IP address, user agent from HttpContext
        // - Send to security monitoring system if configured

        return Task.FromResult(Result.Success());
    }
}

