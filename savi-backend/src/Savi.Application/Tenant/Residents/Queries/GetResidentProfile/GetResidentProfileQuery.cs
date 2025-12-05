using MediatR;
using Savi.Application.Tenant.Residents.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Residents.Queries.GetResidentProfile;

/// <summary>
/// Query to get a comprehensive resident profile by Party ID.
/// </summary>
public record GetResidentProfileQuery(Guid PartyId) : IRequest<Result<ResidentProfileDto>>;
