using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Community.Parties.Commands.AddPartyAddress;
using Savi.Application.Tenant.Community.Parties.Commands.AddPartyContact;
using Savi.Application.Tenant.Community.Parties.Commands.CreateParty;
using Savi.Application.Tenant.Community.Parties.Commands.DeleteParty;
using Savi.Application.Tenant.Community.Parties.Commands.DeletePartyAddress;
using Savi.Application.Tenant.Community.Parties.Commands.DeletePartyContact;
using Savi.Application.Tenant.Community.Parties.Commands.UpdateParty;
using Savi.Application.Tenant.Community.Parties.Commands.UpdatePartyAddress;
using Savi.Application.Tenant.Community.Parties.Commands.UpdatePartyContact;
using Savi.Application.Tenant.Community.Parties.Dtos;
using Savi.Application.Tenant.Community.Parties.Queries.GetPartyById;
using Savi.Application.Tenant.Community.Parties.Queries.ListParties;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Community;

/// <summary>
/// Controller for managing parties (individuals, companies, entities) in the community.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/parties")]
[Authorize]
public class PartiesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PartiesController> _logger;

    public PartiesController(IMediator mediator, ILogger<PartiesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    #region Party CRUD

    /// <summary>
    /// Gets a list of all parties with pagination and optional filtering.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Parties.View)]
    [ProducesResponseType(typeof(PagedResult<PartyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListParties(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] PartyType? partyType = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = new ListPartiesQuery
        {
            Page = page,
            PageSize = pageSize,
            PartyType = partyType,
            SearchTerm = searchTerm
        };

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a party by ID, including addresses and contacts.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Parties.View)]
    [ProducesResponseType(typeof(PartyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPartyById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPartyByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new party.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateParty(
        [FromBody] CreatePartyCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/parties - Creating party: {PartyName}", command.PartyName);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetPartyById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing party.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateParty(
        Guid id,
        [FromBody] UpdatePartyRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdatePartyCommand
        {
            Id = id,
            PartyName = request.PartyName,
            LegalName = request.LegalName,
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            RegistrationNumber = request.RegistrationNumber,
            TaxNumber = request.TaxNumber,
            Notes = request.Notes
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Party not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Soft-deletes a party.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteParty(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new DeletePartyCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    #endregion

    #region Party Addresses

    /// <summary>
    /// Adds an address to a party.
    /// </summary>
    [HttpPost("{partyId:guid}/addresses")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddAddress(
        Guid partyId,
        [FromBody] AddPartyAddressRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddPartyAddressCommand
        {
            PartyId = partyId,
            AddressType = request.AddressType,
            Line1 = request.Line1,
            Line2 = request.Line2,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            IsPrimary = request.IsPrimary
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Party not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Created($"/api/v1/tenant/parties/{partyId}/addresses/{result.Value}", new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing address.
    /// </summary>
    [HttpPut("{partyId:guid}/addresses/{addressId:guid}")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAddress(
        Guid partyId,
        Guid addressId,
        [FromBody] UpdatePartyAddressRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdatePartyAddressCommand
        {
            PartyId = partyId,
            AddressId = addressId,
            AddressType = request.AddressType,
            Line1 = request.Line1,
            Line2 = request.Line2,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            IsPrimary = request.IsPrimary
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Address not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Removes an address from a party.
    /// </summary>
    [HttpDelete("{partyId:guid}/addresses/{addressId:guid}")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAddress(
        Guid partyId,
        Guid addressId,
        CancellationToken cancellationToken = default)
    {
        var command = new DeletePartyAddressCommand(partyId, addressId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    #endregion

    #region Party Contacts

    /// <summary>
    /// Adds a contact to a party.
    /// </summary>
    [HttpPost("{partyId:guid}/contacts")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddContact(
        Guid partyId,
        [FromBody] AddPartyContactRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddPartyContactCommand
        {
            PartyId = partyId,
            ContactType = request.ContactType,
            Value = request.Value,
            IsPrimary = request.IsPrimary
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Party not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Created($"/api/v1/tenant/parties/{partyId}/contacts/{result.Value}", new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing contact.
    /// </summary>
    [HttpPut("{partyId:guid}/contacts/{contactId:guid}")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateContact(
        Guid partyId,
        Guid contactId,
        [FromBody] UpdatePartyContactRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdatePartyContactCommand
        {
            PartyId = partyId,
            ContactId = contactId,
            ContactType = request.ContactType,
            Value = request.Value,
            IsPrimary = request.IsPrimary
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Contact not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Removes a contact from a party.
    /// </summary>
    [HttpDelete("{partyId:guid}/contacts/{contactId:guid}")]
    [HasPermission(Permissions.Tenant.Parties.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteContact(
        Guid partyId,
        Guid contactId,
        CancellationToken cancellationToken = default)
    {
        var command = new DeletePartyContactCommand(partyId, contactId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    #endregion
}

#region Request Models

/// <summary>
/// Request model for updating a party.
/// </summary>
public record UpdatePartyRequest(
    string PartyName,
    string? LegalName,
    string? FirstName,
    string? LastName,
    DateOnly? DateOfBirth,
    string? RegistrationNumber,
    string? TaxNumber,
    string? Notes);

/// <summary>
/// Request model for adding an address to a party.
/// </summary>
public record AddPartyAddressRequest(
    PartyAddressType AddressType,
    string Line1,
    string? Line2,
    string? City,
    string? State,
    string? Country,
    string? PostalCode,
    bool IsPrimary);

/// <summary>
/// Request model for updating a party address.
/// </summary>
public record UpdatePartyAddressRequest(
    PartyAddressType AddressType,
    string Line1,
    string? Line2,
    string? City,
    string? State,
    string? Country,
    string? PostalCode,
    bool IsPrimary);

/// <summary>
/// Request model for adding a contact to a party.
/// </summary>
public record AddPartyContactRequest(
    PartyContactType ContactType,
    string Value,
    bool IsPrimary);

/// <summary>
/// Request model for updating a party contact.
/// </summary>
public record UpdatePartyContactRequest(
    PartyContactType ContactType,
    string Value,
    bool IsPrimary);

#endregion

