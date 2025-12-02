using MediatR;
using Savi.Application.Tenant.Community.Parties.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Queries.GetPartyById;

/// <summary>
/// Query to get a party by ID, including addresses and contacts.
/// </summary>
public record GetPartyByIdQuery(Guid Id) : IRequest<Result<PartyDto>>;

