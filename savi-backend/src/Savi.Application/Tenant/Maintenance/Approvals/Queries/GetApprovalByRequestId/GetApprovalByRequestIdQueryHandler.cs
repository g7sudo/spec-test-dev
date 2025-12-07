using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Approvals.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Approvals.Queries.GetApprovalByRequestId;

/// <summary>
/// Handler for GetApprovalByRequestIdQuery.
/// </summary>
public class GetApprovalByRequestIdQueryHandler
    : IRequestHandler<GetApprovalByRequestIdQuery, Result<MaintenanceApprovalDto?>>
{
    private readonly ITenantDbContext _dbContext;

    public GetApprovalByRequestIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<MaintenanceApprovalDto?>> Handle(
        GetApprovalByRequestIdQuery request,
        CancellationToken cancellationToken)
    {
        var approval = await _dbContext.MaintenanceApprovals
            .AsNoTracking()
            .Where(a => a.MaintenanceRequestId == request.MaintenanceRequestId && a.IsActive)
            .OrderByDescending(a => a.CreatedAt)
            .Join(
                _dbContext.MaintenanceRequests,
                a => a.MaintenanceRequestId,
                r => r.Id,
                (a, r) => new { Approval = a, Request = r })
            .Join(
                _dbContext.CommunityUsers,
                ar => ar.Approval.RequestedByUserId,
                cu => cu.Id,
                (ar, requestedBy) => new { ar.Approval, ar.Request, RequestedBy = requestedBy })
            .GroupJoin(
                _dbContext.CommunityUsers,
                arr => arr.Approval.ApprovedByUserId,
                cu => cu.Id,
                (arr, approvedByUsers) => new { arr.Approval, arr.Request, arr.RequestedBy, ApprovedByUsers = approvedByUsers })
            .SelectMany(
                x => x.ApprovedByUsers.DefaultIfEmpty(),
                (x, approvedBy) => new MaintenanceApprovalDto
                {
                    Id = x.Approval.Id,
                    MaintenanceRequestId = x.Approval.MaintenanceRequestId,
                    TicketNumber = x.Request.TicketNumber,
                    Status = x.Approval.Status,
                    RequestedAmount = x.Approval.RequestedAmount,
                    Currency = x.Approval.Currency,
                    RequestedByUserId = x.Approval.RequestedByUserId,
                    RequestedByUserName = x.RequestedBy.PreferredName,
                    RequestedAt = x.Approval.RequestedAt,
                    ApprovedByUserId = x.Approval.ApprovedByUserId,
                    ApprovedByUserName = approvedBy != null ? approvedBy.PreferredName : null,
                    ApprovedAt = x.Approval.ApprovedAt,
                    RejectionReason = x.Approval.RejectionReason,
                    CancelledAt = x.Approval.CancelledAt,
                    CancelledByUserId = x.Approval.CancelledByUserId,
                    CancellationReason = x.Approval.CancellationReason,
                    OwnerPaymentStatus = x.Approval.OwnerPaymentStatus,
                    OwnerPaidAmount = x.Approval.OwnerPaidAmount,
                    OwnerPaidAt = x.Approval.OwnerPaidAt,
                    OwnerPaymentReference = x.Approval.OwnerPaymentReference,
                    CreatedAt = x.Approval.CreatedAt
                })
            .FirstOrDefaultAsync(cancellationToken);

        return Result<MaintenanceApprovalDto?>.Success(approval);
    }
}
