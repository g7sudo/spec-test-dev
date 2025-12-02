using MediatR;
using Savi.Application.Tenant.Files.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Files.Queries.GetFileDownloadUrl;

/// <summary>
/// Query to get a download URL for a document.
/// Returns a SAS URL with expiration.
/// </summary>
public record GetFileDownloadUrlQuery(Guid DocumentId) : IRequest<Result<FileDownloadDto>>;
