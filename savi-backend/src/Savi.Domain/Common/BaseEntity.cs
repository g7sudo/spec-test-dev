namespace Savi.Domain.Common;

/// <summary>
/// Base class for all domain entities following the SAVI base entity convention.
/// 
/// All entities include:
/// - Id (uuid, PK)
/// - Version (int, optimistic concurrency)
/// - IsActive (bool, soft-delete flag)
/// - CreatedAt, CreatedBy, UpdatedAt, UpdatedBy (audit fields)
/// - DomainEvents collection for raising domain events
/// 
/// No EF attributes here - this is a pure domain model.
/// EF configuration is done in Infrastructure layer.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Primary key (UUID).
    /// </summary>
    public Guid Id { get; protected set; } = Guid.NewGuid();

    /// <summary>
    /// Version number for optimistic concurrency control.
    /// Incremented on each update.
    /// </summary>
    public int Version { get; protected set; } = 1;

    /// <summary>
    /// Soft-delete flag. When false, the entity is considered "deleted".
    /// </summary>
    public bool IsActive { get; protected set; } = true;

    /// <summary>
    /// Timestamp when the entity was created.
    /// </summary>
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;

    /// <summary>
    /// ID of the user who created this entity.
    /// Nullable for bootstrap/system-created entities.
    /// </summary>
    public Guid? CreatedBy { get; protected set; }

    /// <summary>
    /// Timestamp of the last update.
    /// </summary>
    public DateTime? UpdatedAt { get; protected set; }

    /// <summary>
    /// ID of the user who last updated this entity.
    /// </summary>
    public Guid? UpdatedBy { get; protected set; }

    // Domain events - not persisted, used for dispatching events
    private readonly List<IDomainEvent> _domainEvents = new();

    /// <summary>
    /// Domain events raised by this entity, to be dispatched after persistence.
    /// </summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>
    /// Adds a domain event to be dispatched after the entity is saved.
    /// </summary>
    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    /// <summary>
    /// Removes a specific domain event.
    /// </summary>
    protected void RemoveDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Remove(domainEvent);
    }

    /// <summary>
    /// Clears all domain events (typically called after dispatch).
    /// </summary>
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    /// <summary>
    /// Marks the entity as updated with audit information.
    /// </summary>
    public void MarkAsUpdated(Guid? updatedBy = null)
    {
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        Version++;
    }

    /// <summary>
    /// Soft-deletes the entity by setting IsActive to false.
    /// </summary>
    public void Deactivate(Guid? updatedBy = null)
    {
        IsActive = false;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Reactivates a soft-deleted entity.
    /// </summary>
    public void Activate(Guid? updatedBy = null)
    {
        IsActive = true;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets the audit fields for creation.
    /// </summary>
    public void SetCreatedBy(Guid? createdBy)
    {
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
    }
}

