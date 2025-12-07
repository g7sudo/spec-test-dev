using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for AnnouncementLike entity.
/// Maps to DBML: TenantDB.AnnouncementLike
/// </summary>
public class AnnouncementLikeConfiguration : IEntityTypeConfiguration<AnnouncementLike>
{
    public void Configure(EntityTypeBuilder<AnnouncementLike> builder)
    {
        builder.ToTable("AnnouncementLike");

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
        builder.Property(x => x.AnnouncementId)
            .IsRequired();

        builder.Property(x => x.CommunityUserId)
            .IsRequired();

        // Foreign keys
        builder.HasOne<Announcement>()
            .WithMany()
            .HasForeignKey(x => x.AnnouncementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CommunityUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraint: one like per user per announcement
        builder.HasIndex(x => new { x.AnnouncementId, x.CommunityUserId })
            .IsUnique();

        // Indexes
        builder.HasIndex(x => x.AnnouncementId);
        builder.HasIndex(x => x.CommunityUserId);
    }
}
