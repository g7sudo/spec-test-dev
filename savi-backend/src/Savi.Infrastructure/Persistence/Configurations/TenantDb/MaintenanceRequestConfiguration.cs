using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for MaintenanceRequest entity.
/// Maps to DBML: TenantDB.MaintenanceRequest
/// </summary>
public class MaintenanceRequestConfiguration : IEntityTypeConfiguration<MaintenanceRequest>
{
    public void Configure(EntityTypeBuilder<MaintenanceRequest> builder)
    {
        builder.ToTable("MaintenanceRequest");

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

        // Identity in UI
        builder.Property(x => x.TicketNumber)
            .IsRequired()
            .HasMaxLength(50);

        // Unit + Category
        builder.Property(x => x.UnitId).IsRequired();
        builder.Property(x => x.CategoryId).IsRequired();

        // Who the request is for vs who submitted
        builder.Property(x => x.RequestedForPartyId).IsRequired();
        builder.Property(x => x.RequestedByUserId).IsRequired();
        builder.Property(x => x.AssignedToUserId);

        // Content
        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Description)
            .HasMaxLength(4000);

        // Workflow
        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenanceStatus.New);

        builder.Property(x => x.Priority)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenancePriority.Normal);

        builder.Property(x => x.Source)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenanceSource.MobileApp);

        builder.Property(x => x.RequestedAt).IsRequired();
        builder.Property(x => x.DueBy);
        builder.Property(x => x.AssignedAt);
        builder.Property(x => x.StartedAt);
        builder.Property(x => x.CompletedAt);

        builder.Property(x => x.RejectedAt);
        builder.Property(x => x.RejectionReason)
            .HasMaxLength(2000);

        builder.Property(x => x.CancelledAt);
        builder.Property(x => x.CancelledByUserId);
        builder.Property(x => x.CancellationReason)
            .HasMaxLength(2000);

        // Site visit assessment
        builder.Property(x => x.AssessmentSummary)
            .HasMaxLength(4000);
        builder.Property(x => x.AssessmentCompletedAt);
        builder.Property(x => x.AssessmentByUserId);

        // Resident review
        builder.Property(x => x.ResidentRating);
        builder.Property(x => x.ResidentFeedback)
            .HasMaxLength(2000);
        builder.Property(x => x.RatedAt);

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

        // Foreign key to MaintenanceCategory
        builder.HasOne<MaintenanceCategory>()
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to Party (RequestedForPartyId)
        builder.HasOne<Party>()
            .WithMany()
            .HasForeignKey(x => x.RequestedForPartyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (RequestedByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (AssignedToUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (CancelledByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CancelledByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Foreign key to CommunityUser (AssessmentByUserId)
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.AssessmentByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.TicketNumber).IsUnique();
        builder.HasIndex(x => x.UnitId);
        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Priority);
        builder.HasIndex(x => x.RequestedAt);
        builder.HasIndex(x => x.AssignedToUserId);
        builder.HasIndex(x => x.RequestedForPartyId);
        builder.HasIndex(x => x.RequestedByUserId);
    }
}
