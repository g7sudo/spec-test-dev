using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for MaintenanceApproval entity.
/// Maps to DBML: TenantDB.MaintenanceApproval
/// </summary>
public class MaintenanceApprovalConfiguration : IEntityTypeConfiguration<MaintenanceApproval>
{
    public void Configure(EntityTypeBuilder<MaintenanceApproval> builder)
    {
        builder.ToTable("MaintenanceApproval");

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
        builder.Property(x => x.MaintenanceRequestId).IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenanceApprovalStatus.Pending);

        builder.Property(x => x.RequestedAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.Currency)
            .HasMaxLength(10);

        builder.Property(x => x.RequestedByUserId).IsRequired();
        builder.Property(x => x.RequestedAt).IsRequired();

        builder.Property(x => x.ApprovedByUserId);
        builder.Property(x => x.ApprovedAt);

        builder.Property(x => x.RejectionReason)
            .HasMaxLength(2000);

        builder.Property(x => x.CancelledAt);
        builder.Property(x => x.CancelledByUserId);
        builder.Property(x => x.CancellationReason)
            .HasMaxLength(2000);

        // Owner payment tracking
        builder.Property(x => x.OwnerPaymentStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenanceOwnerPaymentStatus.NotRequired);

        builder.Property(x => x.OwnerPaidAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.OwnerPaidAt);

        builder.Property(x => x.OwnerPaymentReference)
            .HasMaxLength(500);

        // Foreign keys - CreatedBy/UpdatedBy to CommunityUser
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to MaintenanceRequest
        builder.HasOne<MaintenanceRequest>()
            .WithMany()
            .HasForeignKey(x => x.MaintenanceRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Foreign key to CommunityUser (RequestedByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (ApprovedByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (CancelledByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CancelledByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.MaintenanceRequestId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.RequestedByUserId);
        builder.HasIndex(x => x.ApprovedByUserId);
        builder.HasIndex(x => x.OwnerPaymentStatus);
    }
}
