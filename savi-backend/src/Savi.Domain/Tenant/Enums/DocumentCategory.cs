namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Defines the category/type of document for classification purposes.
/// </summary>
public enum DocumentCategory
{
    /// <summary>
    /// General image file (photos, pictures).
    /// </summary>
    Image = 1,

    /// <summary>
    /// Floor plan or layout diagram.
    /// </summary>
    FloorPlan = 2,

    /// <summary>
    /// General document file (PDF, Word, etc.).
    /// </summary>
    Document = 3,

    /// <summary>
    /// Contract or agreement document.
    /// </summary>
    Contract = 4,

    /// <summary>
    /// Invoice or bill document.
    /// </summary>
    Invoice = 5,

    /// <summary>
    /// Identity proof document (ID card, passport, etc.).
    /// </summary>
    Identity = 6,

    /// <summary>
    /// Other/miscellaneous document type.
    /// </summary>
    Other = 99
}
