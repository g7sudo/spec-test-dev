using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for UserTenantMembership entity.
/// Maps to DBML: PlatformDB.UserTenantMembership
/// </summary>
public class UserTenantMembershipConfiguration : IEntityTypeConfiguration<UserTenantMembership>
{
    public void Configure(EntityTypeBuilder<UserTenantMembership> builder)
    {
        builder.ToTable("UserTenantMembership");

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
        builder.Property(x => x.PlatformUserId).IsRequired();
        builder.Property(x => x.TenantId).IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32)
            .HasDefaultValue(MembershipStatus.Invited);

        builder.Property(x => x.TenantRoleCode)
            .HasMaxLength(64);

        builder.Property(x => x.InvitationToken)
            .HasMaxLength(256);

        builder.Property(x => x.InvitationExpiresAt);
        builder.Property(x => x.InvitedByUserId);
        builder.Property(x => x.JoinedAt);

        // Foreign keys
        builder.HasOne(x => x.PlatformUser)
            .WithMany(x => x.TenantMemberships)
            .HasForeignKey(x => x.PlatformUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Memberships)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.InvitedByUser)
            .WithMany()
            .HasForeignKey(x => x.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<PlatformUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<PlatformUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => new { x.PlatformUserId, x.TenantId }).IsUnique();
        builder.HasIndex(x => x.InvitationToken).IsUnique()
            .HasFilter("\"InvitationToken\" IS NOT NULL");
    }
}

