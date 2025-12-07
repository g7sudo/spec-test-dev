using MediatR;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetVisitorPassByAccessCode;

/// <summary>
/// Query to get a visitor pass by its access code.
/// </summary>
public record GetVisitorPassByAccessCodeQuery(string AccessCode) : IRequest<Result<VisitorPassDto>>;
