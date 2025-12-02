using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Queries.GetTenantById;

/// <summary>
/// Handles retrieving a single tenant by ID.
/// </summary>
public sealed class GetTenantByIdQueryHandler
    : IRequestHandler<GetTenantByIdQuery, Result<TenantDto>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetTenantByIdQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<TenantDto>> Handle(
        GetTenantByIdQuery request,
        CancellationToken cancellationToken)
    {
        var tenant = await _platformDbContext.Tenants
            .AsNoTracking()
            .Where(t => t.Id == request.Id)
            .Select(t => new TenantDto
            {
                Id = t.Id,
                Name = t.Name,
                Code = t.Code,
                Status = t.Status,
                AddressLine1 = t.AddressLine1,
                AddressLine2 = t.AddressLine2,
                City = t.City,
                State = t.State,
                Country = t.Country,
                PostalCode = t.PostalCode,
                Timezone = t.Timezone,
                PrimaryContactName = t.PrimaryContactName,
                PrimaryContactEmail = t.PrimaryContactEmail,
                PrimaryContactPhone = t.PrimaryContactPhone,
                Provider = t.Provider,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                IsActive = t.IsActive
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<TenantDto>("Tenant not found.");
        }

        return Result.Success(tenant);
    }
}
