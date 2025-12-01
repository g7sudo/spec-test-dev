using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for Plan entity.
/// Maps to DBML: PlatformDB.Plan
/// </summary>
public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("Plan");

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
        builder.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(x => x.Description)
            .HasMaxLength(512);

        builder.Property(x => x.MaxRequestsPerMinute)
            .IsRequired()
            .HasDefaultValue(100);

        builder.Property(x => x.DefaultListingExpiryDays)
            .IsRequired()
            .HasDefaultValue(30);

        builder.Property(x => x.IsMarketplaceEnabled)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.IsCrossCommunityMarketplaceEnabled)
            .IsRequired()
            .HasDefaultValue(false);

        // Indexes
        builder.HasIndex(x => x.Code).IsUnique();

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

