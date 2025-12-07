using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for MaintenanceComment entity.
/// Maps to DBML: TenantDB.MaintenanceComment
/// </summary>
public class MaintenanceCommentConfiguration : IEntityTypeConfiguration<MaintenanceComment>
{
    public void Configure(EntityTypeBuilder<MaintenanceComment> builder)
    {
        builder.ToTable("MaintenanceComment");

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

        builder.Property(x => x.CommentType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenanceCommentType.ResidentComment);

        builder.Property(x => x.Message)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(x => x.IsVisibleToResident)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.IsVisibleToOwner)
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

        // Foreign key to MaintenanceRequest
        builder.HasOne<MaintenanceRequest>()
            .WithMany()
            .HasForeignKey(x => x.MaintenanceRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(x => x.MaintenanceRequestId);
        builder.HasIndex(x => x.CommentType);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.IsVisibleToResident);
        builder.HasIndex(x => x.IsVisibleToOwner);
    }
}
