using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenity;

/// <summary>
/// Command to create a new amenity.
/// </summary>
public record CreateAmenityCommand(
    string Name,
    string? Code,
    AmenityType Type,
    string? Description,
    string? LocationText,
    bool IsVisibleInApp,
    int DisplayOrder,
    bool IsBookable,
    bool RequiresApproval,
    int SlotDurationMinutes,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime,
    int CleanupBufferMinutes,
    int MaxDaysInAdvance,
    int? MaxActiveBookingsPerUnit,
    int? MaxGuests,
    bool DepositRequired,
    decimal? DepositAmount,
    /// <summary>
    /// List of tempKeys for uploaded images.
    /// All TempFileUploads with these keys will be moved to permanent storage.
    /// </summary>
    List<string>? TempDocuments = null
) : IRequest<Result<Guid>>;
