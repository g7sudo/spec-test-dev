using MediatR;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateAmenity;

/// <summary>
/// Command to update an existing amenity.
/// </summary>
public record UpdateAmenityCommand(
    Guid Id,
    string Name,
    string? Code,
    AmenityType Type,
    AmenityStatus Status,
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
    /// List of existing documents to manage (update or delete).
    /// Documents with ActionState.Deleted will be soft-deleted.
    /// Others will have their metadata updated.
    /// </summary>
    List<DocumentManagementDto>? Documents = null,
    /// <summary>
    /// List of tempKeys for new documents to add.
    /// All TempFileUploads with these keys will be moved to permanent storage.
    /// </summary>
    List<string>? TempDocuments = null
) : IRequest<Result<bool>>;
