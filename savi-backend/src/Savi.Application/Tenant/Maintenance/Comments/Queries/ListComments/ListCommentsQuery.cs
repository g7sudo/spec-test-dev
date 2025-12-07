using MediatR;
using Savi.Application.Tenant.Maintenance.Comments.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Comments.Queries.ListComments;

/// <summary>
/// Query to list all comments for a maintenance request.
/// </summary>
public record ListCommentsQuery(
    Guid MaintenanceRequestId,
    bool IncludeInternal = true
) : IRequest<Result<List<MaintenanceCommentDto>>>;
