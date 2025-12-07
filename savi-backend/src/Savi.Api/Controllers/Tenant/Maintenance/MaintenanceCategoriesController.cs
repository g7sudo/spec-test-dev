using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Maintenance.Categories.Commands.CreateMaintenanceCategory;
using Savi.Application.Tenant.Maintenance.Categories.Commands.DeleteMaintenanceCategory;
using Savi.Application.Tenant.Maintenance.Categories.Commands.UpdateMaintenanceCategory;
using Savi.Application.Tenant.Maintenance.Categories.Dtos;
using Savi.Application.Tenant.Maintenance.Categories.Queries.GetMaintenanceCategoryById;
using Savi.Application.Tenant.Maintenance.Categories.Queries.ListMaintenanceCategories;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Maintenance;

/// <summary>
/// Controller for managing maintenance categories.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/maintenance/categories")]
[Authorize]
public class MaintenanceCategoriesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<MaintenanceCategoriesController> _logger;

    public MaintenanceCategoriesController(IMediator mediator, ILogger<MaintenanceCategoriesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of all maintenance categories with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(PagedResult<MaintenanceCategorySummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListCategories(
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isDefault = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListMaintenanceCategoriesQuery(searchTerm, isDefault, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a maintenance category by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(MaintenanceCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCategoryById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMaintenanceCategoryByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new maintenance category.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateCategory(
        [FromBody] CreateMaintenanceCategoryCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/maintenance/categories - Creating category: {CategoryName}", command.Name);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetCategoryById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing maintenance category.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateCategory(
        Guid id,
        [FromBody] UpdateMaintenanceCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateMaintenanceCategoryCommand(
            id,
            request.Name,
            request.Code,
            request.Description,
            request.DisplayOrder,
            request.IsDefault);

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
    /// Deletes a maintenance category.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteCategory(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteMaintenanceCategoryCommand(id);
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
/// Request model for updating a maintenance category.
/// </summary>
public record UpdateMaintenanceCategoryRequest(
    string Name,
    string? Code,
    string? Description,
    int DisplayOrder,
    bool IsDefault);
