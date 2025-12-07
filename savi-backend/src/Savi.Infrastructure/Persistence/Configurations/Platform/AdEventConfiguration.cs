using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for AdEvent entity.
/// </summary>
public class AdEventConfiguration : IEntityTypeConfiguration<AdEvent>
{
    public void Configure(EntityTypeBuilder<AdEvent> builder)
    {
        builder.ToTable("AdEvent");

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
        builder.Property(x => x.CampaignId)
            .IsRequired();

        builder.Property(x => x.CreativeId)
            .IsRequired();

        builder.Property(x => x.TenantId)
            .IsRequired();

        builder.Property(x => x.PlatformUserId);

        builder.Property(x => x.EventType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.OccurredAt)
            .IsRequired();

        builder.Property(x => x.Screen)
            .HasMaxLength(50);

        builder.Property(x => x.Placement)
            .HasConversion<string>()
            .HasMaxLength(30);

        // Indexes - Optimized for analytics queries
        // Primary index for campaign analytics
        builder.HasIndex(x => new { x.CampaignId, x.EventType, x.OccurredAt })
            .HasDatabaseName("IX_AdEvent_CampaignAnalytics");

        // Index for creative-level analytics
        builder.HasIndex(x => new { x.CreativeId, x.EventType, x.OccurredAt })
            .HasDatabaseName("IX_AdEvent_CreativeAnalytics");

        // Index for tenant-level analytics
        builder.HasIndex(x => new { x.TenantId, x.EventType, x.OccurredAt })
            .HasDatabaseName("IX_AdEvent_TenantAnalytics");

        // Index for user-level analytics (optional user)
        builder.HasIndex(x => new { x.PlatformUserId, x.EventType, x.OccurredAt })
            .HasFilter("\"PlatformUserId\" IS NOT NULL")
            .HasDatabaseName("IX_AdEvent_UserAnalytics");

        // Index for deduplication (same user, creative, event type within time window)
        builder.HasIndex(x => new { x.PlatformUserId, x.CreativeId, x.EventType, x.OccurredAt })
            .HasFilter("\"PlatformUserId\" IS NOT NULL")
            .HasDatabaseName("IX_AdEvent_Deduplication");

        // Index for date range queries
        builder.HasIndex(x => x.OccurredAt);

        // Foreign keys
        builder.HasOne(x => x.Campaign)
            .WithMany(c => c.Events)
            .HasForeignKey(x => x.CampaignId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Creative)
            .WithMany(c => c.Events)
            .HasForeignKey(x => x.CreativeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.PlatformUser)
            .WithMany()
            .HasForeignKey(x => x.PlatformUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // No audit FK for AdEvent as they are system-generated
    }
}
