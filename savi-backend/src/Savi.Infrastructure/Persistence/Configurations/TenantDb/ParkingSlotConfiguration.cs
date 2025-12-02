using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for ParkingSlot entity.
/// Maps to DBML: TenantDB.ParkingSlot
/// </summary>
public class ParkingSlotConfiguration : IEntityTypeConfiguration<ParkingSlot>
{
    public void Configure(EntityTypeBuilder<ParkingSlot> builder)
    {
        builder.ToTable("ParkingSlot");

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
        builder.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.LocationType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(x => x.LevelLabel)
            .HasMaxLength(64);

        builder.Property(x => x.IsCovered)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.IsEVCompatible)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(x => x.Notes)
            .HasMaxLength(2000);

        builder.Property(x => x.AllocatedUnitId);

        // Foreign keys
        builder.HasOne<Unit>()
            .WithMany()
            .HasForeignKey(x => x.AllocatedUnitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.Code);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.AllocatedUnitId)
            .HasFilter("\"AllocatedUnitId\" IS NOT NULL");
    }
}
