using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for DeviceRegistration entity.
/// </summary>
public class DeviceRegistrationConfiguration : IEntityTypeConfiguration<DeviceRegistration>
{
    public void Configure(EntityTypeBuilder<DeviceRegistration> builder)
    {
        builder.ToTable("DeviceRegistration");

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

        builder.Property(x => x.DeviceToken)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.DeviceId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.DeviceName)
            .HasMaxLength(200);

        builder.Property(x => x.Platform)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.AppVersion)
            .HasMaxLength(50);

        builder.Property(x => x.OsVersion)
            .HasMaxLength(50);

        builder.Property(x => x.LastActiveAt);
        builder.Property(x => x.TokenRefreshedAt);

        // Indexes
        // Unique index on DeviceToken to prevent duplicate registrations
        builder.HasIndex(x => x.DeviceToken)
            .IsUnique()
            .HasFilter("\"IsActive\" = true");

        // Index for looking up devices by user
        builder.HasIndex(x => new { x.PlatformUserId, x.IsActive });

        // Index for finding device by DeviceId (for upsert operations)
        builder.HasIndex(x => new { x.DeviceId, x.PlatformUserId })
            .IsUnique()
            .HasFilter("\"IsActive\" = true");

        // Index for cleanup of inactive devices
        builder.HasIndex(x => x.LastActiveAt);

        // Foreign keys
        builder.HasOne(x => x.PlatformUser)
            .WithMany()
            .HasForeignKey(x => x.PlatformUserId)
            .OnDelete(DeleteBehavior.Cascade);

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
