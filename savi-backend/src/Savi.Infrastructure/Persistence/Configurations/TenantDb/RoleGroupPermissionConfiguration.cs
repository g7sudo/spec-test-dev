using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for RoleGroupPermission entity.
/// Maps to DBML: TenantDB.RoleGroupPermission
/// </summary>
public class RoleGroupPermissionConfiguration : IEntityTypeConfiguration<RoleGroupPermission>
{
    public void Configure(EntityTypeBuilder<RoleGroupPermission> builder)
    {
        builder.ToTable("RoleGroupPermission");

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
        builder.Property(x => x.RoleGroupId).IsRequired();

        builder.Property(x => x.PermissionKey)
            .IsRequired()
            .HasMaxLength(128);

        // Foreign keys
        builder.HasOne(x => x.RoleGroup)
            .WithMany(x => x.Permissions)
            .HasForeignKey(x => x.RoleGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique index on (RoleGroupId, PermissionKey)
        builder.HasIndex(x => new { x.RoleGroupId, x.PermissionKey }).IsUnique();
    }
}

