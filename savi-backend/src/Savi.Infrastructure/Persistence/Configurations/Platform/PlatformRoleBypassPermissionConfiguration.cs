using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for PlatformRoleBypassPermission entity.
/// Maps to DBML: PlatformDB.PlatformRoleBypassPermission
/// </summary>
public class PlatformRoleBypassPermissionConfiguration : IEntityTypeConfiguration<PlatformRoleBypassPermission>
{
    public void Configure(EntityTypeBuilder<PlatformRoleBypassPermission> builder)
    {
        builder.ToTable("PlatformRoleBypassPermission");

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
        builder.Property(x => x.PlatformRoleId).IsRequired();

        builder.Property(x => x.PermissionKey)
            .IsRequired()
            .HasMaxLength(128);

        // Scope enum - default handled by domain, not DB
        builder.Property(x => x.Scope)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);

        // Foreign keys
        builder.HasOne(x => x.PlatformRole)
            .WithMany(x => x.BypassPermissions)
            .HasForeignKey(x => x.PlatformRoleId)
            .OnDelete(DeleteBehavior.Cascade);

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

