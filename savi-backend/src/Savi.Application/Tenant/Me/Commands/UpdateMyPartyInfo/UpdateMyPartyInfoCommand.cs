using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyPartyInfo;

/// <summary>
/// Command to update the current user's party (personal) information.
/// Allows residents to enrich their records with name, phone, etc.
/// </summary>
public record UpdateMyPartyInfoCommand : IRequest<Result<UpdateMyPartyInfoResult>>
{
    /// <summary>
    /// First name.
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Last name.
    /// </summary>
    public string? LastName { get; init; }

    /// <summary>
    /// Date of birth.
    /// </summary>
    public DateOnly? DateOfBirth { get; init; }

    /// <summary>
    /// Primary phone number.
    /// </summary>
    public string? PhoneNumber { get; init; }

    /// <summary>
    /// Primary email address.
    /// Note: This updates the Party's email contact, not the Firebase auth email.
    /// </summary>
    public string? Email { get; init; }
}

/// <summary>
/// Result of updating party info.
/// </summary>
public record UpdateMyPartyInfoResult
{
    /// <summary>
    /// The party ID that was updated.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Updated party name.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// First name.
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Last name.
    /// </summary>
    public string? LastName { get; init; }

    /// <summary>
    /// Primary email.
    /// </summary>
    public string? PrimaryEmail { get; init; }

    /// <summary>
    /// Primary phone.
    /// </summary>
    public string? PrimaryPhone { get; init; }
}
