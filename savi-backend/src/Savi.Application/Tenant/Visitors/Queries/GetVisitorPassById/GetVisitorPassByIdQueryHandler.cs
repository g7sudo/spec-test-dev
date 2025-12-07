using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetVisitorPassById;

/// <summary>
/// Handler for getting a visitor pass by ID.
/// </summary>
public class GetVisitorPassByIdQueryHandler
    : IRequestHandler<GetVisitorPassByIdQuery, Result<VisitorPassDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetVisitorPassByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<VisitorPassDto>> Handle(
        GetVisitorPassByIdQuery request,
        CancellationToken cancellationToken)
    {
        var visitorPass = await _dbContext.VisitorPasses
            .AsNoTracking()
            .Where(v => v.Id == request.Id && v.IsActive)
            .Join(
                _dbContext.Units.AsNoTracking(),
                v => v.UnitId,
                u => u.Id,
                (v, u) => new { Pass = v, Unit = u })
            .GroupJoin(
                _dbContext.Blocks.AsNoTracking(),
                vu => vu.Unit.BlockId,
                b => b.Id,
                (vu, blocks) => new { vu.Pass, vu.Unit, Blocks = blocks })
            .SelectMany(
                x => x.Blocks.DefaultIfEmpty(),
                (x, block) => new { x.Pass, x.Unit, Block = block })
            .GroupJoin(
                _dbContext.CommunityUsers.AsNoTracking(),
                x => x.Pass.RequestedForUserId,
                cu => cu.Id,
                (x, users) => new { x.Pass, x.Unit, x.Block, RequestedForUsers = users })
            .SelectMany(
                x => x.RequestedForUsers.DefaultIfEmpty(),
                (x, requestedForUser) => new { x.Pass, x.Unit, x.Block, RequestedForUser = requestedForUser })
            .GroupJoin(
                _dbContext.CommunityUsers.AsNoTracking(),
                x => x.Pass.CheckInByUserId,
                cu => cu.Id,
                (x, users) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, CheckInUsers = users })
            .SelectMany(
                x => x.CheckInUsers.DefaultIfEmpty(),
                (x, checkInUser) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, CheckInUser = checkInUser })
            .GroupJoin(
                _dbContext.CommunityUsers.AsNoTracking(),
                x => x.Pass.CheckOutByUserId,
                cu => cu.Id,
                (x, users) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, CheckOutUsers = users })
            .SelectMany(
                x => x.CheckOutUsers.DefaultIfEmpty(),
                (x, checkOutUser) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, CheckOutUser = checkOutUser })
            .GroupJoin(
                _dbContext.CommunityUsers.AsNoTracking(),
                x => x.Pass.ApprovedByUserId,
                cu => cu.Id,
                (x, users) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, x.CheckOutUser, ApprovedByUsers = users })
            .SelectMany(
                x => x.ApprovedByUsers.DefaultIfEmpty(),
                (x, approvedByUser) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, x.CheckOutUser, ApprovedByUser = approvedByUser })
            .GroupJoin(
                _dbContext.CommunityUsers.AsNoTracking(),
                x => x.Pass.RejectedByUserId,
                cu => cu.Id,
                (x, users) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, x.CheckOutUser, x.ApprovedByUser, RejectedByUsers = users })
            .SelectMany(
                x => x.RejectedByUsers.DefaultIfEmpty(),
                (x, rejectedByUser) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, x.CheckOutUser, x.ApprovedByUser, RejectedByUser = rejectedByUser })
            .GroupJoin(
                _dbContext.CommunityUsers.AsNoTracking(),
                x => x.Pass.CreatedBy,
                cu => cu.Id,
                (x, users) => new { x.Pass, x.Unit, x.Block, x.RequestedForUser, x.CheckInUser, x.CheckOutUser, x.ApprovedByUser, x.RejectedByUser, CreatedByUsers = users })
            .SelectMany(
                x => x.CreatedByUsers.DefaultIfEmpty(),
                (x, createdByUser) => new VisitorPassDto
                {
                    Id = x.Pass.Id,
                    UnitId = x.Pass.UnitId,
                    UnitNumber = x.Unit.UnitNumber,
                    BlockName = x.Block != null ? x.Block.Name : null,
                    VisitType = x.Pass.VisitType,
                    Source = x.Pass.Source,
                    AccessCode = x.Pass.AccessCode,
                    RequestedForUserId = x.Pass.RequestedForUserId,
                    RequestedForUserName = x.RequestedForUser != null ? x.RequestedForUser.PreferredName : null,
                    VisitorName = x.Pass.VisitorName,
                    VisitorPhone = x.Pass.VisitorPhone,
                    VisitorIdType = x.Pass.VisitorIdType,
                    VisitorIdNumber = x.Pass.VisitorIdNumber,
                    VehicleNumber = x.Pass.VehicleNumber,
                    VehicleType = x.Pass.VehicleType,
                    DeliveryProvider = x.Pass.DeliveryProvider,
                    Notes = x.Pass.Notes,
                    ExpectedFrom = x.Pass.ExpectedFrom,
                    ExpectedTo = x.Pass.ExpectedTo,
                    ExpiresAt = x.Pass.ExpiresAt,
                    CheckInAt = x.Pass.CheckInAt,
                    CheckOutAt = x.Pass.CheckOutAt,
                    CheckInByUserId = x.Pass.CheckInByUserId,
                    CheckInByUserName = x.CheckInUser != null ? x.CheckInUser.PreferredName : null,
                    CheckOutByUserId = x.Pass.CheckOutByUserId,
                    CheckOutByUserName = x.CheckOutUser != null ? x.CheckOutUser.PreferredName : null,
                    Status = x.Pass.Status,
                    ApprovedByUserId = x.Pass.ApprovedByUserId,
                    ApprovedByUserName = x.ApprovedByUser != null ? x.ApprovedByUser.PreferredName : null,
                    ApprovedAt = x.Pass.ApprovedAt,
                    RejectedByUserId = x.Pass.RejectedByUserId,
                    RejectedByUserName = x.RejectedByUser != null ? x.RejectedByUser.PreferredName : null,
                    RejectedAt = x.Pass.RejectedAt,
                    RejectedReason = x.Pass.RejectedReason,
                    NotifyVisitorAtGate = x.Pass.NotifyVisitorAtGate,
                    CreatedAt = x.Pass.CreatedAt,
                    CreatedBy = x.Pass.CreatedBy,
                    CreatedByUserName = createdByUser != null ? createdByUser.PreferredName : null
                })
            .FirstOrDefaultAsync(cancellationToken);

        if (visitorPass == null)
        {
            return Result<VisitorPassDto>.Failure($"Visitor pass with ID '{request.Id}' not found.");
        }

        return Result<VisitorPassDto>.Success(visitorPass);
    }
}
