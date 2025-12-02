using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Files.Commands.DeleteFile;

/// <summary>
/// Handler for deleting a document/file.
/// </summary>
public class DeleteFileCommandHandler : IRequestHandler<DeleteFileCommand, Result>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public DeleteFileCommandHandler(
        IFileStorageService fileStorageService,
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _fileStorageService = fileStorageService;
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteFileCommand request, CancellationToken cancellationToken)
    {
        // Find document
        var document = await _dbContext.Documents
            .Where(x => x.Id == request.DocumentId && x.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (document == null)
        {
            return Result.Failure("Document not found.");
        }

        try
        {
            // Delete blob from storage
            await _fileStorageService.DeleteFileAsync(document.BlobPath, cancellationToken);

            // Soft-delete document record
            document.Deactivate();
            document.MarkAsUpdated(_currentUser.UserId);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to delete file: {ex.Message}");
        }
    }
}
