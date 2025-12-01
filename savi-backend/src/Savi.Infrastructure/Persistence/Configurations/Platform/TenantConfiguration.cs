using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

// Explicit alias to avoid conflict with Savi.Domain.Tenant namespace
using TenantEntity = Savi.Domain.Platform.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for Tenant entity.
/// Maps to DBML: PlatformDB.Tenant
/// </summary>
public class TenantConfiguration : IEntityTypeConfiguration<TenantEntity>
{
    public void Configure(EntityTypeBuilder<TenantEntity> builder)
    {
        builder.ToTable("Tenant");

        // Primary key
        builder.HasKey(x => x.Id);

        // Base entity fields
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Version).IsRequired().HasDefaultValue(1);
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy);
        builder.Property(x => x.UpdatedAt);
        builder.Property(x => x.UpdatedBy);

        // Entity-specific fields
        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Code)
            .HasMaxLength(64);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);

        // Address fields
        builder.Property(x => x.AddressLine1).HasMaxLength(256);
        builder.Property(x => x.AddressLine2).HasMaxLength(256);
        builder.Property(x => x.City).HasMaxLength(128);
        builder.Property(x => x.State).HasMaxLength(128);
        builder.Property(x => x.Country).HasMaxLength(128);
        builder.Property(x => x.PostalCode).HasMaxLength(32);

        builder.Property(x => x.Timezone).HasMaxLength(64);

        // Primary contact
        builder.Property(x => x.PrimaryContactName).HasMaxLength(256);
        builder.Property(x => x.PrimaryContactEmail).HasMaxLength(256);
        builder.Property(x => x.PrimaryContactPhone).HasMaxLength(50);

        // Database connection
        builder.Property(x => x.Provider)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(x => x.ConnectionString)
            .IsRequired()
            .HasMaxLength(1024);

        // Indexes
        builder.HasIndex(x => x.Code).IsUnique()
            .HasFilter("\"Code\" IS NOT NULL");

        // Foreign keys
        builder.HasOne<PlatformUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<PlatformUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

