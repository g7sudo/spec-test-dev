using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for ResidentInvite entity.
/// Maps to DBML: TenantDB.ResidentInvite
/// </summary>
public class ResidentInviteConfiguration : IEntityTypeConfiguration<ResidentInvite>
{
    public void Configure(EntityTypeBuilder<ResidentInvite> builder)
    {
        builder.ToTable("ResidentInvite");

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
        builder.Property(x => x.LeaseId)
            .IsRequired();

        builder.Property(x => x.PartyId)
            .IsRequired();

        builder.Property(x => x.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(ResidentInviteStatus.Pending);

        builder.Property(x => x.InvitationToken)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.ExpiresAt)
            .IsRequired();

        builder.Property(x => x.AcceptedAt);

        builder.Property(x => x.AcceptedByUserId);

        builder.Property(x => x.CancelledAt);

        builder.Property(x => x.CancelledByUserId);

        // Foreign keys
        builder.HasOne<Lease>()
            .WithMany()
            .HasForeignKey(x => x.LeaseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Party>()
            .WithMany()
            .HasForeignKey(x => x.PartyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.AcceptedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CancelledByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.LeaseId);
        builder.HasIndex(x => x.PartyId);
        builder.HasIndex(x => x.InvitationToken).IsUnique();
        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.LeaseId, x.Status });
        builder.HasIndex(x => x.ExpiresAt);
    }
}
