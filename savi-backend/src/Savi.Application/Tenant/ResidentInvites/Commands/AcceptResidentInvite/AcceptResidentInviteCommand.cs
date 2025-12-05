using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Commands.AcceptResidentInvite;

/// <summary>
/// Command to accept a resident invite.
/// Called after user authenticates via Firebase.
/// </summary>
public record AcceptResidentInviteCommand(
    Guid InviteId,
    string InvitationToken
) : IRequest<Result<AcceptResidentInviteResult>>;

/// <summary>
/// Result of accepting a resident invite.
/// </summary>
public record AcceptResidentInviteResult
{
    /// <summary>
    /// The community user ID created/used.
    /// </summary>
    public Guid CommunityUserId { get; init; }

    /// <summary>
    /// The lease party ID created.
    /// </summary>
    public Guid LeasePartyId { get; init; }

    /// <summary>
    /// The lease ID.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// Unit label for display.
    /// </summary>
    public string UnitLabel { get; init; } = string.Empty;
}
