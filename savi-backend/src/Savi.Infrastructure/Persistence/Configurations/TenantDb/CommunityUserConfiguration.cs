using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.Tenant;

/// <summary>
/// EF Core configuration for CommunityUser entity.
/// Maps to DBML: TenantDB.CommunityUser
/// </summary>
public class CommunityUserConfiguration : IEntityTypeConfiguration<CommunityUser>
{
    public void Configure(EntityTypeBuilder<CommunityUser> builder)
    {
        builder.ToTable("CommunityUser");

        // Primary key
        builder.HasKey(x => x.Id);

        // Base entity fields
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Version).IsRequired().HasDefaultValue(1);
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy); // Nullable for bootstrap
        builder.Property(x => x.UpdatedAt);
        builder.Property(x => x.UpdatedBy);

        // Entity-specific fields
        builder.Property(x => x.PartyId).IsRequired();

        builder.Property(x => x.PlatformUserId); // Logical FK, not enforced

        builder.Property(x => x.PreferredName)
            .HasMaxLength(256);

        builder.Property(x => x.Timezone)
            .HasMaxLength(64);

        builder.Property(x => x.Locale)
            .HasMaxLength(16);

        // Indexes
        builder.HasIndex(x => x.PlatformUserId)
            .HasFilter("\"PlatformUserId\" IS NOT NULL");

        // Self-referencing FK for CreatedBy/UpdatedBy
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

