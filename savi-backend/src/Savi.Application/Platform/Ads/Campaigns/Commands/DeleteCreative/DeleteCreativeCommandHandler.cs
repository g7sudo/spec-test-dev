using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.DeleteCreative;

/// <summary>
/// Handler for DeleteCreativeCommand.
/// </summary>
public sealed class DeleteCreativeCommandHandler : IRequestHandler<DeleteCreativeCommand, Result>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeleteCreativeCommandHandler> _logger;

    public DeleteCreativeCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<DeleteCreativeCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteCreativeCommand command, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var creative = await _platformDbContext.CampaignCreatives
            .Include(c => c.Campaign)
            .FirstOrDefaultAsync(x => x.Id == command.CreativeId && x.IsActive, cancellationToken);

        if (creative == null)
        {
            return Result.Failure("Creative not found.");
        }

        // Cannot delete creative from active campaign
        if (creative.Campaign?.Status == CampaignStatus.Active)
        {
            return Result.Failure("Cannot delete creative from an active campaign. Please pause the campaign first.");
        }

        _logger.LogInformation(
            "Deleting creative {CreativeId} from campaign {CampaignId} by user {UserId}",
            command.CreativeId,
            creative.CampaignId,
            userId);

        creative.Deactivate(userId);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Deleted creative {CreativeId}",
            command.CreativeId);

        return Result.Success();
    }
}
