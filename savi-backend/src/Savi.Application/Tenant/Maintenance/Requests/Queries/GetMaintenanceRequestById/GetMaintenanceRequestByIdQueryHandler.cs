using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.GetMaintenanceRequestById;

/// <summary>
/// Handler for GetMaintenanceRequestByIdQuery.
/// </summary>
public class GetMaintenanceRequestByIdQueryHandler
    : IRequestHandler<GetMaintenanceRequestByIdQuery, Result<MaintenanceRequestDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetMaintenanceRequestByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<MaintenanceRequestDto>> Handle(
        GetMaintenanceRequestByIdQuery request,
        CancellationToken cancellationToken)
    {
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.Id == request.Id && r.IsActive)
            .Join(
                _dbContext.Units,
                r => r.UnitId,
                u => u.Id,
                (r, u) => new { Request = r, Unit = u })
            .Join(
                _dbContext.MaintenanceCategories,
                ru => ru.Request.CategoryId,
                c => c.Id,
                (ru, c) => new { ru.Request, ru.Unit, Category = c })
            .Join(
                _dbContext.Parties,
                ruc => ruc.Request.RequestedForPartyId,
                p => p.Id,
                (ruc, p) => new { ruc.Request, ruc.Unit, ruc.Category, RequestedForParty = p })
            .Join(
                _dbContext.CommunityUsers,
                rucp => rucp.Request.RequestedByUserId,
                cu => cu.Id,
                (rucp, cu) => new { rucp.Request, rucp.Unit, rucp.Category, rucp.RequestedForParty, RequestedByUser = cu })
            .GroupJoin(
                _dbContext.CommunityUsers,
                rucpu => rucpu.Request.AssignedToUserId,
                cu => cu.Id,
                (rucpu, assignedUsers) => new { rucpu.Request, rucpu.Unit, rucpu.Category, rucpu.RequestedForParty, rucpu.RequestedByUser, AssignedUsers = assignedUsers })
            .SelectMany(
                x => x.AssignedUsers.DefaultIfEmpty(),
                (x, assignedUser) => new MaintenanceRequestDto
                {
                    Id = x.Request.Id,
                    TicketNumber = x.Request.TicketNumber,
                    UnitId = x.Request.UnitId,
                    UnitNumber = x.Unit.UnitNumber,
                    CategoryId = x.Request.CategoryId,
                    CategoryName = x.Category.Name,
                    RequestedForPartyId = x.Request.RequestedForPartyId,
                    RequestedForPartyName = x.RequestedForParty.PartyName,
                    RequestedByUserId = x.Request.RequestedByUserId,
                    RequestedByUserName = x.RequestedByUser.PreferredName,
                    AssignedToUserId = x.Request.AssignedToUserId,
                    AssignedToUserName = assignedUser != null ? assignedUser.PreferredName : null,
                    Title = x.Request.Title,
                    Description = x.Request.Description,
                    Status = x.Request.Status,
                    Priority = x.Request.Priority,
                    Source = x.Request.Source,
                    RequestedAt = x.Request.RequestedAt,
                    DueBy = x.Request.DueBy,
                    AssignedAt = x.Request.AssignedAt,
                    StartedAt = x.Request.StartedAt,
                    CompletedAt = x.Request.CompletedAt,
                    RejectedAt = x.Request.RejectedAt,
                    RejectionReason = x.Request.RejectionReason,
                    CancelledAt = x.Request.CancelledAt,
                    CancelledByUserId = x.Request.CancelledByUserId,
                    CancellationReason = x.Request.CancellationReason,
                    AssessmentSummary = x.Request.AssessmentSummary,
                    AssessmentCompletedAt = x.Request.AssessmentCompletedAt,
                    AssessmentByUserId = x.Request.AssessmentByUserId,
                    ResidentRating = x.Request.ResidentRating,
                    ResidentFeedback = x.Request.ResidentFeedback,
                    RatedAt = x.Request.RatedAt,
                    CreatedAt = x.Request.CreatedAt
                })
            .FirstOrDefaultAsync(cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result<MaintenanceRequestDto>.Failure($"Maintenance request with ID '{request.Id}' not found.");
        }

        return Result<MaintenanceRequestDto>.Success(maintenanceRequest);
    }
}
