using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for PartyAddress entity.
/// Maps to DBML: TenantDB.PartyAddress
/// </summary>
public class PartyAddressConfiguration : IEntityTypeConfiguration<PartyAddress>
{
    public void Configure(EntityTypeBuilder<PartyAddress> builder)
    {
        builder.ToTable("PartyAddress");

        // Primary key
        builder.HasKey(x => x.Id);

        // Base entity fields
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Version).IsRequired().HasDefaultValue(1);
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.UpdatedAt);
        builder.Property(x => x.UpdatedBy);

        // Entity-specific fields
        builder.Property(x => x.PartyId)
            .IsRequired();

        builder.Property(x => x.AddressType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(x => x.Line1)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Line2)
            .HasMaxLength(500);

        builder.Property(x => x.City)
            .HasMaxLength(200);

        builder.Property(x => x.State)
            .HasMaxLength(200);

        builder.Property(x => x.Country)
            .HasMaxLength(200);

        builder.Property(x => x.PostalCode)
            .HasMaxLength(50);

        builder.Property(x => x.IsPrimary)
            .IsRequired()
            .HasDefaultValue(false);

        // Indexes
        builder.HasIndex(x => x.PartyId);
        builder.HasIndex(x => x.AddressType);
        builder.HasIndex(x => x.IsPrimary);
        builder.HasIndex(x => x.IsActive);

        // Foreign key to Party (defined in PartyConfiguration via navigation)
        // No need to define here as it's handled by the parent

        // Foreign keys (audit fields)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

