namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Represents the action state of a document in API requests/responses.
/// Used to indicate what should happen to the document.
/// </summary>
public enum DocumentActionState
{
    /// <summary>Document is active and should remain unchanged.</summary>
    Active = 0,

    /// <summary>Document should be marked as deleted/inactive.</summary>
    Deleted = 1
}
