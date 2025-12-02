using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Files.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Files.Queries.GetFileDownloadUrl;

/// <summary>
/// Handler for generating download URL for a document.
/// </summary>
public class GetFileDownloadUrlQueryHandler : IRequestHandler<GetFileDownloadUrlQuery, Result<FileDownloadDto>>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public GetFileDownloadUrlQueryHandler(
        IFileStorageService fileStorageService,
        ITenantDbContext dbContext,
        IConfiguration configuration)
    {
        _fileStorageService = fileStorageService;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<Result<FileDownloadDto>> Handle(GetFileDownloadUrlQuery request, CancellationToken cancellationToken)
    {
        // Find document
        var document = await _dbContext.Documents
            .Where(x => x.Id == request.DocumentId && x.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (document == null)
        {
            return Result<FileDownloadDto>.Failure("Document not found.");
        }

        try
        {
            // Generate SAS URL
            var expiryMinutes = _configuration.GetValue<int>("FileUpload:SasTokenExpiryMinutes", 60);
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                document.BlobPath,
                expiryMinutes,
                cancellationToken);

            var dto = new FileDownloadDto
            {
                DownloadUrl = downloadUrl,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
            };

            return Result<FileDownloadDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<FileDownloadDto>.Failure($"Failed to generate download URL: {ex.Message}");
        }
    }
}
