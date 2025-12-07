using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetVisitorPassByAccessCode;

/// <summary>
/// Handler for getting a visitor pass by access code.
/// </summary>
public class GetVisitorPassByAccessCodeQueryHandler
    : IRequestHandler<GetVisitorPassByAccessCodeQuery, Result<VisitorPassDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetVisitorPassByAccessCodeQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<VisitorPassDto>> Handle(
        GetVisitorPassByAccessCodeQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.AccessCode))
        {
            return Result<VisitorPassDto>.Failure("Access code is required.");
        }

        var visitorPass = await _dbContext.VisitorPasses
            .AsNoTracking()
            .Where(v => v.AccessCode == request.AccessCode
                && v.IsActive
                && (v.Status == VisitorPassStatus.PreRegistered || v.Status == VisitorPassStatus.Approved))
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
            .Select(x => new VisitorPassDto
            {
                Id = x.Pass.Id,
                UnitId = x.Pass.UnitId,
                UnitNumber = x.Unit.UnitNumber,
                BlockName = x.Block != null ? x.Block.Name : null,
                VisitType = x.Pass.VisitType,
                Source = x.Pass.Source,
                AccessCode = x.Pass.AccessCode,
                RequestedForUserId = x.Pass.RequestedForUserId,
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
                CheckOutByUserId = x.Pass.CheckOutByUserId,
                Status = x.Pass.Status,
                ApprovedByUserId = x.Pass.ApprovedByUserId,
                ApprovedAt = x.Pass.ApprovedAt,
                RejectedByUserId = x.Pass.RejectedByUserId,
                RejectedAt = x.Pass.RejectedAt,
                RejectedReason = x.Pass.RejectedReason,
                NotifyVisitorAtGate = x.Pass.NotifyVisitorAtGate,
                CreatedAt = x.Pass.CreatedAt,
                CreatedBy = x.Pass.CreatedBy
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (visitorPass == null)
        {
            return Result<VisitorPassDto>.Failure("Access code not found or pass is not valid for check-in.");
        }

        // Validate the pass is still valid
        if (visitorPass.ExpiresAt.HasValue && DateTime.UtcNow > visitorPass.ExpiresAt.Value)
        {
            return Result<VisitorPassDto>.Failure("Access code has expired.");
        }

        if (visitorPass.ExpectedFrom.HasValue && visitorPass.ExpectedTo.HasValue)
        {
            var now = DateTime.UtcNow;
            if (now < visitorPass.ExpectedFrom.Value || now > visitorPass.ExpectedTo.Value)
            {
                return Result<VisitorPassDto>.Failure(
                    $"Access code is only valid between {visitorPass.ExpectedFrom.Value:g} and {visitorPass.ExpectedTo.Value:g}.");
            }
        }

        return Result<VisitorPassDto>.Success(visitorPass);
    }
}
