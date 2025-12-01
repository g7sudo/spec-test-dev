using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for PlatformUserRole entity.
/// Maps to DBML: PlatformDB.PlatformUserRole
/// </summary>
public class PlatformUserRoleConfiguration : IEntityTypeConfiguration<PlatformUserRole>
{
    public void Configure(EntityTypeBuilder<PlatformUserRole> builder)
    {
        builder.ToTable("PlatformUserRole");

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

        // Foreign keys
        builder.Property(x => x.PlatformUserId).IsRequired();
        builder.Property(x => x.PlatformRoleId).IsRequired();

        builder.HasOne(x => x.PlatformUser)
            .WithMany(x => x.PlatformUserRoles)
            .HasForeignKey(x => x.PlatformUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.PlatformRole)
            .WithMany(x => x.UserRoles)
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

        // Unique index on (PlatformUserId, PlatformRoleId)
        builder.HasIndex(x => new { x.PlatformUserId, x.PlatformRoleId }).IsUnique();
    }
}

