using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for UnitOwnership entity.
/// Maps to DBML: TenantDB.UnitOwnership
/// </summary>
public class UnitOwnershipConfiguration : IEntityTypeConfiguration<UnitOwnership>
{
    public void Configure(EntityTypeBuilder<UnitOwnership> builder)
    {
        builder.ToTable("UnitOwnership");

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
        builder.Property(x => x.UnitId)
            .IsRequired();

        builder.Property(x => x.PartyId)
            .IsRequired();

        builder.Property(x => x.OwnershipShare)
            .IsRequired()
            .HasPrecision(5, 2)
            .HasDefaultValue(100m);

        builder.Property(x => x.FromDate)
            .IsRequired();

        builder.Property(x => x.ToDate);

        builder.Property(x => x.IsPrimaryOwner)
            .IsRequired()
            .HasDefaultValue(false);

        // Foreign keys
        builder.HasOne<Unit>()
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Party>()
            .WithMany()
            .HasForeignKey(x => x.PartyId)
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
        builder.HasIndex(x => x.UnitId);
        builder.HasIndex(x => x.PartyId);
        builder.HasIndex(x => new { x.UnitId, x.PartyId, x.FromDate });
        builder.HasIndex(x => x.IsPrimaryOwner);
    }
}
