using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.UserNotifications.Queries.GetNotifications;

/// <summary>
/// Handler for GetNotificationsQuery.
/// </summary>
public sealed class GetNotificationsQueryHandler
    : IRequestHandler<GetNotificationsQuery, Result<PagedResult<UserNotificationDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public GetNotificationsQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<PagedResult<UserNotificationDto>>> Handle(
        GetNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantUserId == null)
        {
            return Result.Failure<PagedResult<UserNotificationDto>>("User not found in community.");
        }

        var communityUserId = _currentUser.TenantUserId.Value;

        var query = _dbContext.UserNotifications
            .Where(n => n.CommunityUserId == communityUserId && n.IsActive);

        // Apply filters
        if (request.Category.HasValue)
        {
            query = query.Where(n => n.Category == request.Category.Value);
        }

        if (request.IsRead.HasValue)
        {
            query = query.Where(n => n.IsRead == request.IsRead.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering (newest first)
        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new UserNotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Body = n.Body,
                Category = n.Category.ToString(),
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                ActionUrl = n.ActionUrl,
                ReferenceType = n.ReferenceType,
                ReferenceId = n.ReferenceId,
                ImageUrl = n.ImageUrl,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<UserNotificationDto>(
            notifications,
            totalCount,
            request.Page,
            request.PageSize);

        return Result.Success(pagedResult);
    }
}
