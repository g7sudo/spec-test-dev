using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents an individual, company, or entity in this community.
/// This is the master entity for people/companies that can own units, lease, etc.
/// Maps to DBML: Table Party
/// </summary>
public class Party : BaseEntity
{
    /// <summary>
    /// Type of party (Individual, Company, Entity).
    /// </summary>
    public PartyType PartyType { get; private set; }

    /// <summary>
    /// Display name (e.g. "John Doe", "ABC Real Estate LLC").
    /// </summary>
    public string PartyName { get; private set; } = string.Empty;

    /// <summary>
    /// Registered legal name if different from display name.
    /// </summary>
    public string? LegalName { get; private set; }

    // Individual-specific fields (used when PartyType = Individual)

    /// <summary>
    /// First name (for individuals).
    /// </summary>
    public string? FirstName { get; private set; }

    /// <summary>
    /// Last name (for individuals).
    /// </summary>
    public string? LastName { get; private set; }

    /// <summary>
    /// Date of birth (for individuals).
    /// </summary>
    public DateOnly? DateOfBirth { get; private set; }

    // Company/Entity-specific fields (used when PartyType = Company/Entity)

    /// <summary>
    /// Business registration number (for companies/entities).
    /// </summary>
    public string? RegistrationNumber { get; private set; }

    /// <summary>
    /// Tax identification number (for companies/entities).
    /// </summary>
    public string? TaxNumber { get; private set; }

    /// <summary>
    /// Additional notes about the party.
    /// </summary>
    public string? Notes { get; private set; }

    // Navigation properties
    private readonly List<PartyAddress> _addresses = new();
    private readonly List<PartyContact> _contacts = new();

    /// <summary>
    /// Addresses associated with this party.
    /// </summary>
    public IReadOnlyCollection<PartyAddress> Addresses => _addresses.AsReadOnly();

    /// <summary>
    /// Contact information associated with this party.
    /// </summary>
    public IReadOnlyCollection<PartyContact> Contacts => _contacts.AsReadOnly();

    // EF Core constructor
    private Party() { }

    /// <summary>
    /// Creates a new Individual party.
    /// </summary>
    public static Party CreateIndividual(
        string firstName,
        string lastName,
        string partyName,
        string? legalName,
        DateOnly? dateOfBirth,
        string? notes,
        Guid? createdBy)
    {
        var party = new Party
        {
            PartyType = PartyType.Individual,
            FirstName = firstName,
            LastName = lastName,
            PartyName = partyName,
            LegalName = legalName,
            DateOfBirth = dateOfBirth,
            Notes = notes
        };

        party.SetCreatedBy(createdBy);
        return party;
    }

    /// <summary>
    /// Creates a new Company or Entity party.
    /// </summary>
    public static Party CreateCompanyOrEntity(
        PartyType partyType,
        string partyName,
        string? legalName,
        string? registrationNumber,
        string? taxNumber,
        string? notes,
        Guid? createdBy)
    {
        if (partyType == PartyType.Individual)
        {
            throw new ArgumentException("Use CreateIndividual for individual parties.", nameof(partyType));
        }

        var party = new Party
        {
            PartyType = partyType,
            PartyName = partyName,
            LegalName = legalName,
            RegistrationNumber = registrationNumber,
            TaxNumber = taxNumber,
            Notes = notes
        };

        party.SetCreatedBy(createdBy);
        return party;
    }

    /// <summary>
    /// Updates individual-specific fields.
    /// </summary>
    public void UpdateIndividual(
        string firstName,
        string lastName,
        string partyName,
        string? legalName,
        DateOnly? dateOfBirth,
        string? notes,
        Guid? updatedBy)
    {
        if (PartyType != PartyType.Individual)
        {
            throw new InvalidOperationException("Cannot update individual fields on a non-individual party.");
        }

        FirstName = firstName;
        LastName = lastName;
        PartyName = partyName;
        LegalName = legalName;
        DateOfBirth = dateOfBirth;
        Notes = notes;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates company/entity-specific fields.
    /// </summary>
    public void UpdateCompanyOrEntity(
        string partyName,
        string? legalName,
        string? registrationNumber,
        string? taxNumber,
        string? notes,
        Guid? updatedBy)
    {
        if (PartyType == PartyType.Individual)
        {
            throw new InvalidOperationException("Cannot update company fields on an individual party.");
        }

        PartyName = partyName;
        LegalName = legalName;
        RegistrationNumber = registrationNumber;
        TaxNumber = taxNumber;
        Notes = notes;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Adds an address to this party.
    /// </summary>
    internal void AddAddress(PartyAddress address)
    {
        _addresses.Add(address);
    }

    /// <summary>
    /// Adds a contact to this party.
    /// </summary>
    internal void AddContact(PartyContact contact)
    {
        _contacts.Add(contact);
    }
}

