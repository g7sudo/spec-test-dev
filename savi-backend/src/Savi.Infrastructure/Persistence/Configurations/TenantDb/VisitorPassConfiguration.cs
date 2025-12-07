using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for VisitorPass entity.
/// Maps to DBML: TenantDB.VisitorPass
/// </summary>
public class VisitorPassConfiguration : IEntityTypeConfiguration<VisitorPass>
{
    public void Configure(EntityTypeBuilder<VisitorPass> builder)
    {
        builder.ToTable("VisitorPass");

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

        // Unit & Source
        builder.Property(x => x.UnitId).IsRequired();

        builder.Property(x => x.VisitType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(VisitorType.Guest);

        builder.Property(x => x.Source)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(VisitorSource.MobileApp);

        // Pre-registration access code
        builder.Property(x => x.AccessCode)
            .HasMaxLength(20);

        // Who the visit is for
        builder.Property(x => x.RequestedForUserId);

        // Visitor details
        builder.Property(x => x.VisitorName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.VisitorPhone)
            .HasMaxLength(50);

        builder.Property(x => x.VisitorIdType)
            .HasMaxLength(50);

        builder.Property(x => x.VisitorIdNumber)
            .HasMaxLength(100);

        // Vehicle
        builder.Property(x => x.VehicleNumber)
            .HasMaxLength(50);

        builder.Property(x => x.VehicleType)
            .HasMaxLength(50);

        // Delivery provider
        builder.Property(x => x.DeliveryProvider)
            .HasMaxLength(100);

        // Notes
        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        // Visit timing
        builder.Property(x => x.ExpectedFrom);
        builder.Property(x => x.ExpectedTo);
        builder.Property(x => x.ExpiresAt);
        builder.Property(x => x.CheckInAt);
        builder.Property(x => x.CheckOutAt);
        builder.Property(x => x.CheckInByUserId);
        builder.Property(x => x.CheckOutByUserId);

        // Approval & status
        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(VisitorPassStatus.PreRegistered);

        builder.Property(x => x.ApprovedByUserId);
        builder.Property(x => x.ApprovedAt);
        builder.Property(x => x.RejectedByUserId);
        builder.Property(x => x.RejectedAt);
        builder.Property(x => x.RejectedReason)
            .HasMaxLength(500);

        // Notifications
        builder.Property(x => x.NotifyVisitorAtGate)
            .IsRequired()
            .HasDefaultValue(true);

        // Foreign keys - CreatedBy/UpdatedBy to CommunityUser
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to Unit
        builder.HasOne<Unit>()
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (RequestedForUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.RequestedForUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (CheckInByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CheckInByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (CheckOutByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CheckOutByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (ApprovedByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (RejectedByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.RejectedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.AccessCode);
        builder.HasIndex(x => x.UnitId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.VisitType);
        builder.HasIndex(x => x.Source);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.ExpectedFrom);
        builder.HasIndex(x => x.CheckInAt);
        builder.HasIndex(x => x.RequestedForUserId);
    }
}
