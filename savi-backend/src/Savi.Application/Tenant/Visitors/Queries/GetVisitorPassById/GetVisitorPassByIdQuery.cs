using MediatR;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetVisitorPassById;

/// <summary>
/// Query to get a visitor pass by its ID.
/// </summary>
public record GetVisitorPassByIdQuery(Guid Id) : IRequest<Result<VisitorPassDto>>;
