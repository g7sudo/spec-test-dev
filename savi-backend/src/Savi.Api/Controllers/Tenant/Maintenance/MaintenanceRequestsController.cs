using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Maintenance.Requests.Commands.AssignMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.CancelMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.CompleteMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.CreateMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.RateMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.RejectMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.StartMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.SubmitAssessment;
using Savi.Application.Tenant.Maintenance.Requests.Commands.UnassignMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Commands.UpdateMaintenanceRequest;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.Application.Tenant.Maintenance.Requests.Queries.GetMaintenanceRequestById;
using Savi.Application.Tenant.Maintenance.RequestDetails.Commands.AddMaintenanceRequestDetail;
using Savi.Application.Tenant.Maintenance.RequestDetails.Commands.DeleteMaintenanceRequestDetail;
using Savi.Application.Tenant.Maintenance.RequestDetails.Commands.UpdateMaintenanceRequestDetail;
using Savi.Application.Tenant.Maintenance.RequestDetails.Dtos;
using Savi.Application.Tenant.Maintenance.RequestDetails.Queries.ListMaintenanceRequestDetails;
using Savi.Application.Tenant.Maintenance.Approvals.Commands.ApproveRequest;
using Savi.Application.Tenant.Maintenance.Approvals.Commands.RecordPayment;
using Savi.Application.Tenant.Maintenance.Approvals.Commands.RejectApproval;
using Savi.Application.Tenant.Maintenance.Approvals.Commands.RequestApproval;
using Savi.Application.Tenant.Maintenance.Approvals.Dtos;
using Savi.Application.Tenant.Maintenance.Approvals.Queries.GetApprovalByRequestId;
using Savi.Application.Tenant.Maintenance.Comments.Commands.AddComment;
using Savi.Application.Tenant.Maintenance.Comments.Commands.DeleteComment;
using Savi.Application.Tenant.Maintenance.Comments.Dtos;
using Savi.Application.Tenant.Maintenance.Comments.Queries.ListComments;
using Savi.Application.Tenant.Maintenance.Requests.Queries.ListMaintenanceRequests;
using Savi.Application.Tenant.Maintenance.Requests.Queries.ListMyMaintenanceRequests;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Maintenance;

/// <summary>
/// Controller for managing maintenance requests.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/maintenance/requests")]
[Authorize]
public class MaintenanceRequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<MaintenanceRequestsController> _logger;

    public MaintenanceRequestsController(IMediator mediator, ILogger<MaintenanceRequestsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of all maintenance requests with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(PagedResult<MaintenanceRequestSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListRequests(
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? unitId = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] MaintenanceStatus? status = null,
        [FromQuery] MaintenancePriority? priority = null,
        [FromQuery] Guid? assignedToUserId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListMaintenanceRequestsQuery(
            searchTerm, unitId, categoryId, status, priority,
            assignedToUserId, fromDate, toDate, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets maintenance requests submitted by the current user.
    /// </summary>
    [HttpGet("my-requests")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestCreate)]
    [ProducesResponseType(typeof(PagedResult<MaintenanceRequestSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListMyRequests(
        [FromQuery] MaintenanceStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListMyMaintenanceRequestsQuery(status, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a maintenance request by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(MaintenanceRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRequestById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMaintenanceRequestByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new maintenance request.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Maintenance.RequestCreate)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateRequest(
        [FromBody] CreateMaintenanceRequestCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/maintenance/requests - Creating request for unit: {UnitId}", command.UnitId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetRequestById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing maintenance request.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateRequest(
        Guid id,
        [FromBody] UpdateMaintenanceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateMaintenanceRequestCommand(
            id,
            request.Title,
            request.Description,
            request.CategoryId,
            request.Priority);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Assigns a maintenance request to a technician.
    /// </summary>
    [HttpPost("{id:guid}/assign")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestAssign)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AssignRequest(
        Guid id,
        [FromBody] AssignMaintenanceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AssignMaintenanceRequestCommand(id, request.AssignedToUserId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Unassigns a maintenance request from its current technician.
    /// </summary>
    [HttpPost("{id:guid}/unassign")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestAssign)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UnassignRequest(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new UnassignMaintenanceRequestCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Starts work on a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/start")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> StartRequest(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new StartMaintenanceRequestCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Completes a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CompleteRequest(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new CompleteMaintenanceRequestCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Rejects a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RejectRequest(
        Guid id,
        [FromBody] RejectMaintenanceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RejectMaintenanceRequestCommand(id, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Cancels a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelRequest(
        Guid id,
        [FromBody] CancelMaintenanceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CancelMaintenanceRequestCommand(id, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Submits a site visit assessment for a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/assessment")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SubmitAssessment(
        Guid id,
        [FromBody] SubmitAssessmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new SubmitAssessmentCommand(id, request.AssessmentSummary);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    // ==================== Request Details Endpoints ====================

    /// <summary>
    /// Gets all detail lines for a maintenance request.
    /// </summary>
    [HttpGet("{id:guid}/details")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(List<MaintenanceRequestDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListDetails(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new ListMaintenanceRequestDetailsQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Adds a detail line to a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/details")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddDetail(
        Guid id,
        [FromBody] AddMaintenanceRequestDetailRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddMaintenanceRequestDetailCommand(
            id,
            request.LineType,
            request.Description,
            request.Quantity,
            request.UnitOfMeasure,
            request.EstimatedUnitPrice,
            request.IsBillable,
            request.SortOrder);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return Created($"api/v1/tenant/maintenance/requests/{id}/details/{result.Value}", new { id = result.Value });
    }

    /// <summary>
    /// Updates a detail line.
    /// </summary>
    [HttpPut("{id:guid}/details/{detailId:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateDetail(
        Guid id,
        Guid detailId,
        [FromBody] UpdateMaintenanceRequestDetailRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateMaintenanceRequestDetailCommand(
            detailId,
            request.LineType,
            request.Description,
            request.Quantity,
            request.UnitOfMeasure,
            request.EstimatedUnitPrice,
            request.IsBillable,
            request.SortOrder);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Deletes a detail line.
    /// </summary>
    [HttpDelete("{id:guid}/details/{detailId:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteDetail(
        Guid id,
        Guid detailId,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteMaintenanceRequestDetailCommand(detailId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    // ==================== Approval Endpoints ====================

    /// <summary>
    /// Gets the approval for a maintenance request.
    /// </summary>
    [HttpGet("{id:guid}/approval")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(MaintenanceApprovalDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetApproval(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetApprovalByRequestIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        if (result.Value == null)
        {
            return NotFound(new { error = "No approval found for this request." });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Requests owner approval for a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/approval")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestApproveCost)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RequestApproval(
        Guid id,
        [FromBody] RequestApprovalRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RequestApprovalCommand(
            id,
            request.RequestedAmount,
            request.Currency,
            request.RequiresOwnerPayment);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return Created($"api/v1/tenant/maintenance/requests/{id}/approval", new { id = result.Value });
    }

    /// <summary>
    /// Approves a maintenance approval request.
    /// </summary>
    [HttpPost("{id:guid}/approval/approve")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestApproveCost)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ApproveApproval(
        Guid id,
        [FromBody] ApproveApprovalRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new ApproveRequestCommand(request.ApprovalId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Rejects a maintenance approval request.
    /// </summary>
    [HttpPost("{id:guid}/approval/reject")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestApproveCost)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RejectApproval(
        Guid id,
        [FromBody] RejectApprovalRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RejectApprovalCommand(request.ApprovalId, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Records owner payment for an approved request.
    /// </summary>
    [HttpPost("{id:guid}/approval/payment")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestApproveCost)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RecordPayment(
        Guid id,
        [FromBody] RecordPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RecordPaymentCommand(request.ApprovalId, request.PaidAmount, request.PaymentReference);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    // ==================== Rating Endpoint ====================

    /// <summary>
    /// Submits a rating for a completed maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/rate")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestCreate)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RateRequest(
        Guid id,
        [FromBody] RateMaintenanceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RateMaintenanceRequestCommand(id, request.Rating, request.Feedback);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    // ==================== Comment Endpoints ====================

    /// <summary>
    /// Gets all comments for a maintenance request.
    /// </summary>
    [HttpGet("{id:guid}/comments")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(List<MaintenanceCommentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListComments(
        Guid id,
        [FromQuery] bool includeInternal = true,
        CancellationToken cancellationToken = default)
    {
        var query = new ListCommentsQuery(id, includeInternal);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Adds a comment to a maintenance request.
    /// </summary>
    [HttpPost("{id:guid}/comments")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddComment(
        Guid id,
        [FromBody] AddMaintenanceCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddCommentCommand(
            id,
            request.CommentType,
            request.Message,
            request.IsVisibleToResident,
            request.IsVisibleToOwner);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return Created($"api/v1/tenant/maintenance/requests/{id}/comments/{result.Value}", new { id = result.Value });
    }

    /// <summary>
    /// Deletes a comment.
    /// </summary>
    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteComment(
        Guid id,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteCommentCommand(commentId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating a maintenance request.
/// </summary>
public record UpdateMaintenanceRequestRequest(
    string Title,
    string? Description,
    Guid CategoryId,
    MaintenancePriority Priority);

/// <summary>
/// Request model for assigning a maintenance request.
/// </summary>
public record AssignMaintenanceRequestRequest(Guid AssignedToUserId);

/// <summary>
/// Request model for rejecting a maintenance request.
/// </summary>
public record RejectMaintenanceRequestRequest(string Reason);

/// <summary>
/// Request model for cancelling a maintenance request.
/// </summary>
public record CancelMaintenanceRequestRequest(string Reason);

/// <summary>
/// Request model for submitting an assessment.
/// </summary>
public record SubmitAssessmentRequest(string AssessmentSummary);

/// <summary>
/// Request model for adding a detail line.
/// </summary>
public record AddMaintenanceRequestDetailRequest(
    MaintenanceDetailType LineType,
    string Description,
    decimal Quantity,
    string? UnitOfMeasure,
    decimal? EstimatedUnitPrice,
    bool IsBillable,
    int SortOrder = 0);

/// <summary>
/// Request model for updating a detail line.
/// </summary>
public record UpdateMaintenanceRequestDetailRequest(
    MaintenanceDetailType LineType,
    string Description,
    decimal Quantity,
    string? UnitOfMeasure,
    decimal? EstimatedUnitPrice,
    bool IsBillable,
    int SortOrder);

/// <summary>
/// Request model for requesting approval.
/// </summary>
public record RequestApprovalRequest(
    decimal? RequestedAmount,
    string? Currency,
    bool RequiresOwnerPayment);

/// <summary>
/// Request model for approving an approval.
/// </summary>
public record ApproveApprovalRequest(Guid ApprovalId);

/// <summary>
/// Request model for rejecting an approval.
/// </summary>
public record RejectApprovalRequest(Guid ApprovalId, string Reason);

/// <summary>
/// Request model for recording payment.
/// </summary>
public record RecordPaymentRequest(
    Guid ApprovalId,
    decimal PaidAmount,
    string? PaymentReference);

/// <summary>
/// Request model for adding a maintenance comment.
/// </summary>
public record AddMaintenanceCommentRequest(
    MaintenanceCommentType CommentType,
    string Message,
    bool IsVisibleToResident,
    bool IsVisibleToOwner);

/// <summary>
/// Request model for rating a maintenance request.
/// </summary>
public record RateMaintenanceRequestRequest(
    int Rating,
    string? Feedback);
