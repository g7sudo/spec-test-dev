using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for PlatformAuditLog entity.
/// Maps to DBML: PlatformDB.PlatformAuditLog
/// </summary>
public class PlatformAuditLogConfiguration : IEntityTypeConfiguration<PlatformAuditLog>
{
    public void Configure(EntityTypeBuilder<PlatformAuditLog> builder)
    {
        builder.ToTable("PlatformAuditLog");

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

        // Audit-specific fields
        builder.Property(x => x.Timestamp).IsRequired();

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(x => x.EntityType)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(x => x.EntityId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.OldValues)
            .HasColumnType("jsonb"); // PostgreSQL jsonb, SQLite will store as text

        builder.Property(x => x.NewValues)
            .HasColumnType("jsonb");

        builder.Property(x => x.CorrelationId)
            .HasMaxLength(128);

        // Foreign keys
        builder.HasOne(x => x.PlatformUser)
            .WithMany()
            .HasForeignKey(x => x.PlatformUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes for common queries
        builder.HasIndex(x => x.Timestamp);
        builder.HasIndex(x => x.Action);
        builder.HasIndex(x => x.EntityType);
        builder.HasIndex(x => new { x.EntityType, x.EntityId });
        builder.HasIndex(x => x.PlatformUserId);
        builder.HasIndex(x => x.TenantId);
        builder.HasIndex(x => x.CorrelationId);
    }
}

