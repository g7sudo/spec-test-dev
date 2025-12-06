using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for AmenityBlackout entity.
/// This is a new entity for handling amenity blackout dates.
/// </summary>
public class AmenityBlackoutConfiguration : IEntityTypeConfiguration<AmenityBlackout>
{
    public void Configure(EntityTypeBuilder<AmenityBlackout> builder)
    {
        builder.ToTable("AmenityBlackout");

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
        builder.Property(x => x.AmenityId)
            .IsRequired();

        builder.Property(x => x.StartDate)
            .IsRequired();

        builder.Property(x => x.EndDate)
            .IsRequired();

        builder.Property(x => x.Reason)
            .HasMaxLength(500);

        builder.Property(x => x.AutoCancelBookings)
            .IsRequired()
            .HasDefaultValue(false);

        // Foreign keys
        builder.HasOne<Amenity>()
            .WithMany()
            .HasForeignKey(x => x.AmenityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.AmenityId);
        builder.HasIndex(x => x.StartDate);
        builder.HasIndex(x => x.EndDate);
        builder.HasIndex(x => new { x.AmenityId, x.StartDate, x.EndDate });
    }
}
