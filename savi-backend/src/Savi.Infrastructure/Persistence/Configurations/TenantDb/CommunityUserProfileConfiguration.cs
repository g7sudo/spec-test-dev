using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for CommunityUserProfile entity.
/// Maps to DBML: TenantDB.CommunityUserProfile
/// </summary>
public class CommunityUserProfileConfiguration : IEntityTypeConfiguration<CommunityUserProfile>
{
    public void Configure(EntityTypeBuilder<CommunityUserProfile> builder)
    {
        builder.ToTable("CommunityUserProfile");

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

        // CommunityUser reference
        builder.Property(x => x.CommunityUserId).IsRequired();

        // Display / Profile fields
        builder.Property(x => x.DisplayName)
            .HasMaxLength(200);

        builder.Property(x => x.AboutMe)
            .HasMaxLength(2000);

        builder.Property(x => x.ProfilePhotoDocumentId);

        // Directory & Privacy fields
        builder.Property(x => x.DirectoryVisibility)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(Domain.Tenant.Enums.DirectoryVisibilityScope.Community);

        builder.Property(x => x.ShowInDirectory)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.ShowNameInDirectory)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.ShowUnitInDirectory)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.ShowPhoneInDirectory)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.ShowEmailInDirectory)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.ShowProfilePhotoInDirectory)
            .IsRequired()
            .HasDefaultValue(true);

        // Notification preference fields
        builder.Property(x => x.PushEnabled)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.EmailEnabled)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.NotifyMaintenanceUpdates)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.NotifyAmenityBookings)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.NotifyVisitorAtGate)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.NotifyAnnouncements)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.NotifyMarketplace)
            .IsRequired()
            .HasDefaultValue(true);

        // Indexes
        builder.HasIndex(x => x.CommunityUserId).IsUnique();
        builder.HasIndex(x => x.IsActive);

        // Foreign keys
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CommunityUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Document>()
            .WithMany()
            .HasForeignKey(x => x.ProfilePhotoDocumentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Audit foreign keys
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

