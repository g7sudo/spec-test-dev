using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for Unit entity.
/// Maps to DBML: TenantDB.Unit
/// </summary>
public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.ToTable("Unit");

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
        builder.Property(x => x.BlockId)
            .IsRequired();

        builder.Property(x => x.FloorId)
            .IsRequired();

        builder.Property(x => x.UnitTypeId)
            .IsRequired();

        builder.Property(x => x.UnitNumber)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.AreaSqft)
            .HasPrecision(10, 2);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(x => x.Notes)
            .HasMaxLength(2000);

        // Foreign keys
        builder.HasOne<Block>()
            .WithMany()
            .HasForeignKey(x => x.BlockId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Floor>()
            .WithMany()
            .HasForeignKey(x => x.FloorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UnitType>()
            .WithMany()
            .HasForeignKey(x => x.UnitTypeId)
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
        builder.HasIndex(x => x.BlockId);
        builder.HasIndex(x => x.FloorId);
        builder.HasIndex(x => x.UnitTypeId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.BlockId, x.FloorId, x.UnitNumber });
    }
}
