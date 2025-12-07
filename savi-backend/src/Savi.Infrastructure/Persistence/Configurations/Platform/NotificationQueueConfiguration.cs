using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;

// Explicit alias to avoid conflict with Savi.Domain.Tenant namespace
using TenantEntity = Savi.Domain.Platform.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for NotificationQueue entity.
/// </summary>
public class NotificationQueueConfiguration : IEntityTypeConfiguration<NotificationQueue>
{
    public void Configure(EntityTypeBuilder<NotificationQueue> builder)
    {
        builder.ToTable("NotificationQueue");

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
        builder.Property(x => x.PlatformUserId)
            .IsRequired();

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Body)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(x => x.Data)
            .HasColumnType("text");

        builder.Property(x => x.SourceType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.SourceTenantId);

        builder.Property(x => x.DeduplicationKey)
            .HasMaxLength(256);

        builder.Property(x => x.Priority)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(NotificationPriority.Normal);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(NotificationStatus.Pending);

        builder.Property(x => x.RetryCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.MaxRetries)
            .IsRequired()
            .HasDefaultValue(3);

        builder.Property(x => x.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(x => x.ProcessedAt);
        builder.Property(x => x.ExpiresAt);
        builder.Property(x => x.NextRetryAt);

        // Indexes
        // Primary index for queue processing: pending notifications ordered by priority and creation time
        builder.HasIndex(x => new { x.Status, x.Priority, x.CreatedAt })
            .HasDatabaseName("IX_NotificationQueue_Processing");

        // Index for deduplication lookups
        builder.HasIndex(x => new { x.DeduplicationKey, x.CreatedAt })
            .HasFilter("\"DeduplicationKey\" IS NOT NULL")
            .HasDatabaseName("IX_NotificationQueue_Deduplication");

        // Index for looking up notifications by user
        builder.HasIndex(x => new { x.PlatformUserId, x.CreatedAt });

        // Index for retry processing
        builder.HasIndex(x => new { x.Status, x.NextRetryAt })
            .HasFilter("\"Status\" = 'Pending' AND \"NextRetryAt\" IS NOT NULL")
            .HasDatabaseName("IX_NotificationQueue_Retry");

        // Index for expiration checks
        builder.HasIndex(x => new { x.Status, x.ExpiresAt })
            .HasFilter("\"Status\" = 'Pending' AND \"ExpiresAt\" IS NOT NULL")
            .HasDatabaseName("IX_NotificationQueue_Expiration");

        // Index for tenant-based queries
        builder.HasIndex(x => new { x.SourceTenantId, x.CreatedAt })
            .HasFilter("\"SourceTenantId\" IS NOT NULL");

        // Foreign keys
        builder.HasOne(x => x.PlatformUser)
            .WithMany()
            .HasForeignKey(x => x.PlatformUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<TenantEntity>()
            .WithMany()
            .HasForeignKey(x => x.SourceTenantId)
            .OnDelete(DeleteBehavior.SetNull);

        // Self-referencing FK for CreatedBy/UpdatedBy
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
