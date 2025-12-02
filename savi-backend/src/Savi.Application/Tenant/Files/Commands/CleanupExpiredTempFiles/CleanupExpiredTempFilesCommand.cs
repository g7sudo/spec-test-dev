using MediatR;
using Savi.Application.Tenant.Files.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Files.Commands.CleanupExpiredTempFiles;

/// <summary>
/// Command to cleanup expired temporary files.
/// Admin-only operation to remove old temp files that were never attached.
/// </summary>
public record CleanupExpiredTempFilesCommand(int DaysOld = 7) : IRequest<Result<CleanupResultDto>>;
