namespace Savi.Domain.Common;

/// <summary>
/// Marker interface for domain events.
/// 
/// Domain events represent something that happened in the domain that other parts
/// of the system might want to react to (e.g., VisitorPassCreatedEvent, MaintenanceRequestApprovedEvent).
/// 
/// Domain events live in Savi.Domain as POCOs implementing this interface.
/// Handlers (INotificationHandler{T}) live in Savi.Application.
/// 
/// Note: Domain must not depend on MediatR directly. Infrastructure/Application handles dispatch.
/// </summary>
public interface IDomainEvent
{
    /// <summary>
    /// The timestamp when this event occurred.
    /// </summary>
    DateTime OccurredAt { get; }
}

