using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for MaintenanceCategory entity.
/// Maps to DBML: TenantDB.MaintenanceCategory
/// </summary>
public class MaintenanceCategoryConfiguration : IEntityTypeConfiguration<MaintenanceCategory>
{
    public void Configure(EntityTypeBuilder<MaintenanceCategory> builder)
    {
        builder.ToTable("MaintenanceCategory");

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
        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Code)
            .HasMaxLength(50);

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.IsDefault)
            .IsRequired()
            .HasDefaultValue(false);

        // Foreign keys - CreatedBy/UpdatedBy to CommunityUser
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => x.Code);
        builder.HasIndex(x => x.DisplayOrder);
        builder.HasIndex(x => x.IsDefault);
    }
}
