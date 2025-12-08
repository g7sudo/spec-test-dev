using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

// Explicit alias to avoid conflict with Savi.Domain.Tenant namespace
using TenantEntity = Savi.Domain.Platform.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for ResidentInviteCode entity.
/// Platform-level lookup table for resident invite access codes.
/// </summary>
public class ResidentInviteCodeConfiguration : IEntityTypeConfiguration<ResidentInviteCode>
{
    public void Configure(EntityTypeBuilder<ResidentInviteCode> builder)
    {
        builder.ToTable("ResidentInviteCode");

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
        builder.Property(x => x.AccessCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(x => x.TenantId)
            .IsRequired();

        builder.Property(x => x.TenantCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.TenantName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.InviteId)
            .IsRequired();

        builder.Property(x => x.InvitationToken)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.PartyName)
            .HasMaxLength(255);

        builder.Property(x => x.UnitLabel)
            .HasMaxLength(100);

        builder.Property(x => x.Role)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.ExpiresAt)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(InviteCodeStatus.Active);

        builder.Property(x => x.UsedAt);

        // Indexes
        // Unique index on AccessCode for fast lookups (only active)
        builder.HasIndex(x => x.AccessCode)
            .IsUnique()
            .HasFilter("\"Status\" = 'Active'");

        // Index for looking up by tenant
        builder.HasIndex(x => x.TenantId);

        // Index for looking up by invite ID
        builder.HasIndex(x => x.InviteId);

        // Index for cleanup of expired codes
        builder.HasIndex(x => x.ExpiresAt);

        // Index for status filtering
        builder.HasIndex(x => x.Status);

        // Foreign key to Tenant
        builder.HasOne<TenantEntity>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
