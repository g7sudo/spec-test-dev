using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.ResidentInvites.Commands.AcceptResidentInvite;

/// <summary>
/// Command to accept a resident invite at the platform level.
/// Called after user has signed up via Firebase and is authenticated.
/// </summary>
public sealed record AcceptResidentInviteCommand(
    string AccessCode,
    string InvitationToken
) : IRequest<Result<AcceptResidentInviteResult>>;

/// <summary>
/// Result of accepting a resident invite.
/// </summary>
public sealed record AcceptResidentInviteResult
{
    /// <summary>
    /// The platform user ID.
    /// </summary>
    public Guid PlatformUserId { get; init; }

    /// <summary>
    /// The community user ID created in the tenant.
    /// </summary>
    public Guid CommunityUserId { get; init; }

    /// <summary>
    /// The tenant ID the user joined.
    /// </summary>
    public Guid TenantId { get; init; }

    /// <summary>
    /// The tenant code for API routing.
    /// </summary>
    public string TenantCode { get; init; } = string.Empty;

    /// <summary>
    /// The tenant/community name.
    /// </summary>
    public string TenantName { get; init; } = string.Empty;

    /// <summary>
    /// The lease ID associated with the invite.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// The unit label (e.g., "A-301").
    /// </summary>
    public string? UnitLabel { get; init; }

    /// <summary>
    /// The role assigned (e.g., "PrimaryResident", "CoResident").
    /// </summary>
    public string Role { get; init; } = string.Empty;
}
