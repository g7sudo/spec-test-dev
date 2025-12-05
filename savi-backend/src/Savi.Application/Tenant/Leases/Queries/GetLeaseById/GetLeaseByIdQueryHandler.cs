using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Queries.GetLeaseById;

/// <summary>
/// Handler for GetLeaseByIdQuery.
/// </summary>
public class GetLeaseByIdQueryHandler
    : IRequestHandler<GetLeaseByIdQuery, Result<LeaseDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetLeaseByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<LeaseDto>> Handle(
        GetLeaseByIdQuery request,
        CancellationToken cancellationToken)
    {
        var lease = await _dbContext.Leases
            .AsNoTracking()
            .Where(l => l.Id == request.LeaseId && l.IsActive)
            .Select(l => new
            {
                Lease = l,
                Unit = _dbContext.Units
                    .Where(u => u.Id == l.UnitId)
                    .Select(u => new
                    {
                        u.UnitNumber,
                        BlockName = _dbContext.Blocks
                            .Where(b => b.Id == u.BlockId)
                            .Select(b => b.Name)
                            .FirstOrDefault(),
                        FloorName = _dbContext.Floors
                            .Where(f => f.Id == u.FloorId)
                            .Select(f => f.Name)
                            .FirstOrDefault()
                    })
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (lease == null)
        {
            return Result<LeaseDto>.Failure($"Lease with ID '{request.LeaseId}' not found.");
        }

        // Get lease parties
        var parties = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => lp.LeaseId == request.LeaseId && lp.IsActive)
            .Join(
                _dbContext.Parties,
                lp => lp.PartyId,
                p => p.Id,
                (lp, p) => new LeasePartyDto
                {
                    Id = lp.Id,
                    LeaseId = lp.LeaseId,
                    PartyId = lp.PartyId,
                    PartyName = p.PartyName,
                    PartyType = p.PartyType,
                    CommunityUserId = lp.CommunityUserId,
                    Role = lp.Role,
                    IsPrimary = lp.IsPrimary,
                    MoveInDate = lp.MoveInDate,
                    MoveOutDate = lp.MoveOutDate,
                    IsActive = lp.IsActive
                })
            .ToListAsync(cancellationToken);

        var dto = new LeaseDto
        {
            Id = lease.Lease.Id,
            UnitId = lease.Lease.UnitId,
            UnitNumber = lease.Unit?.UnitNumber ?? string.Empty,
            BlockName = lease.Unit?.BlockName,
            FloorName = lease.Unit?.FloorName,
            Status = lease.Lease.Status,
            StartDate = lease.Lease.StartDate,
            EndDate = lease.Lease.EndDate,
            MonthlyRent = lease.Lease.MonthlyRent,
            DepositAmount = lease.Lease.DepositAmount,
            Notes = lease.Lease.Notes,
            ActivatedAt = lease.Lease.ActivatedAt,
            EndedAt = lease.Lease.EndedAt,
            TerminationReason = lease.Lease.TerminationReason,
            Parties = parties,
            IsActive = lease.Lease.IsActive,
            CreatedAt = lease.Lease.CreatedAt
        };

        return Result<LeaseDto>.Success(dto);
    }
}
