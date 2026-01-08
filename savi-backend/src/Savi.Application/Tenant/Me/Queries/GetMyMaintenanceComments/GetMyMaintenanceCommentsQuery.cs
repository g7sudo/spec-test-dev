using MediatR;
using Savi.Application.Tenant.Maintenance.Comments.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyMaintenanceComments;

/// <summary>
/// Query to get comments for a maintenance request with ownership validation.
/// Only returns comments for requests created by the current user.
/// Automatically filters to only show resident-visible comments.
/// </summary>
public record GetMyMaintenanceCommentsQuery(Guid RequestId) : IRequest<Result<List<MaintenanceCommentDto>>>;
