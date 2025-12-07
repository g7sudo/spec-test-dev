using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for Announcement entity.
/// Maps to DBML: TenantDB.Announcement
/// </summary>
public class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> builder)
    {
        builder.ToTable("Announcement");

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
        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Body)
            .IsRequired()
            .HasMaxLength(10000);

        builder.Property(x => x.Category)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AnnouncementCategory.General);

        builder.Property(x => x.Priority)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AnnouncementPriority.Normal);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AnnouncementStatus.Draft);

        builder.Property(x => x.PublishedAt);
        builder.Property(x => x.ScheduledAt);
        builder.Property(x => x.ExpiresAt);

        // Display flags
        builder.Property(x => x.IsPinned)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.IsBanner)
            .IsRequired()
            .HasDefaultValue(false);

        // Behaviour flags
        builder.Property(x => x.AllowLikes)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.AllowComments)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.AllowAddToCalendar)
            .IsRequired()
            .HasDefaultValue(false);

        // Event fields
        builder.Property(x => x.IsEvent)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.EventStartAt);
        builder.Property(x => x.EventEndAt);

        builder.Property(x => x.IsAllDay)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.EventLocationText)
            .HasMaxLength(500);

        builder.Property(x => x.EventJoinUrl)
            .HasMaxLength(1000);

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
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Category);
        builder.HasIndex(x => x.Priority);
        builder.HasIndex(x => x.PublishedAt);
        builder.HasIndex(x => x.ScheduledAt);
        builder.HasIndex(x => x.ExpiresAt);
        builder.HasIndex(x => x.IsPinned);
        builder.HasIndex(x => x.IsEvent);
        builder.HasIndex(x => x.CreatedAt);
    }
}
