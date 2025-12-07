using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Represents a paying advertiser or local business on the platform.
/// Advertisers can create campaigns to display ads across tenant communities.
/// </summary>
public class Advertiser : BaseEntity
{
    /// <summary>
    /// Business or brand name of the advertiser.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Name of the contact person at the advertiser.
    /// </summary>
    public string? ContactName { get; private set; }

    /// <summary>
    /// Email address for contacting the advertiser.
    /// </summary>
    public string? ContactEmail { get; private set; }

    /// <summary>
    /// Phone number for contacting the advertiser.
    /// </summary>
    public string? ContactPhone { get; private set; }

    /// <summary>
    /// Internal notes about the advertiser.
    /// </summary>
    public string? Notes { get; private set; }

    // Navigation properties
    public ICollection<Campaign> Campaigns { get; private set; } = new List<Campaign>();

    // Private constructor for EF
    private Advertiser() { }

    /// <summary>
    /// Creates a new advertiser.
    /// </summary>
    public static Advertiser Create(
        string name,
        string? contactName = null,
        string? contactEmail = null,
        string? contactPhone = null,
        string? notes = null,
        Guid? createdBy = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Advertiser name is required.", nameof(name));
        }

        var advertiser = new Advertiser
        {
            Name = name.Trim(),
            ContactName = contactName?.Trim(),
            ContactEmail = contactEmail?.Trim(),
            ContactPhone = contactPhone?.Trim(),
            Notes = notes?.Trim()
        };

        advertiser.SetCreatedBy(createdBy);
        return advertiser;
    }

    /// <summary>
    /// Updates the advertiser details.
    /// </summary>
    public void Update(
        string name,
        string? contactName = null,
        string? contactEmail = null,
        string? contactPhone = null,
        string? notes = null,
        Guid? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Advertiser name is required.", nameof(name));
        }

        Name = name.Trim();
        ContactName = contactName?.Trim();
        ContactEmail = contactEmail?.Trim();
        ContactPhone = contactPhone?.Trim();
        Notes = notes?.Trim();
        MarkAsUpdated(updatedBy);
    }
}
