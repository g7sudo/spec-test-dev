using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for AmenityBooking entity.
/// Maps to DBML: TenantDB.AmenityBooking
/// </summary>
public class AmenityBookingConfiguration : IEntityTypeConfiguration<AmenityBooking>
{
    public void Configure(EntityTypeBuilder<AmenityBooking> builder)
    {
        builder.ToTable("AmenityBooking");

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
        builder.Property(x => x.AmenityId)
            .IsRequired();

        builder.Property(x => x.UnitId)
            .IsRequired();

        builder.Property(x => x.BookedForUserId)
            .IsRequired();

        builder.Property(x => x.StartAt)
            .IsRequired();

        builder.Property(x => x.EndAt)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AmenityBookingStatus.PendingApproval);

        builder.Property(x => x.Source)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AmenityBookingSource.MobileApp);

        builder.Property(x => x.Title)
            .HasMaxLength(200);

        builder.Property(x => x.Notes)
            .HasMaxLength(2000);

        builder.Property(x => x.AdminNotes)
            .HasMaxLength(2000);

        builder.Property(x => x.NumberOfGuests);

        // Approval tracking
        builder.Property(x => x.ApprovedAt);
        builder.Property(x => x.ApprovedByUserId);
        builder.Property(x => x.RejectedAt);
        builder.Property(x => x.RejectedByUserId);
        builder.Property(x => x.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(x => x.CancelledAt);
        builder.Property(x => x.CancelledByUserId);
        builder.Property(x => x.CancellationReason)
            .HasMaxLength(1000);

        builder.Property(x => x.CompletedAt);

        // Deposit tracking
        builder.Property(x => x.DepositRequired)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.DepositAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.DepositStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AmenityDepositStatus.NotRequired);

        builder.Property(x => x.DepositReference)
            .HasMaxLength(500);

        // Foreign keys
        builder.HasOne<Amenity>()
            .WithMany()
            .HasForeignKey(x => x.AmenityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Unit>()
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.BookedForUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.RejectedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CancelledByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.AmenityId);
        builder.HasIndex(x => x.UnitId);
        builder.HasIndex(x => x.BookedForUserId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.StartAt);
        builder.HasIndex(x => x.EndAt);
        builder.HasIndex(x => new { x.AmenityId, x.Status });
        builder.HasIndex(x => new { x.AmenityId, x.StartAt, x.EndAt });
        builder.HasIndex(x => new { x.UnitId, x.Status });
    }
}
