using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for AnnouncementAudience entity.
/// Maps to DBML: TenantDB.AnnouncementAudience
/// </summary>
public class AnnouncementAudienceConfiguration : IEntityTypeConfiguration<AnnouncementAudience>
{
    public void Configure(EntityTypeBuilder<AnnouncementAudience> builder)
    {
        builder.ToTable("AnnouncementAudience");

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
        builder.Property(x => x.AnnouncementId)
            .IsRequired();

        builder.Property(x => x.TargetType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AudienceTargetType.Community);

        builder.Property(x => x.BlockId);
        builder.Property(x => x.UnitId);
        builder.Property(x => x.RoleGroupId);

        // Foreign keys
        builder.HasOne<Announcement>()
            .WithMany()
            .HasForeignKey(x => x.AnnouncementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Block>()
            .WithMany()
            .HasForeignKey(x => x.BlockId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Unit>()
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<RoleGroup>()
            .WithMany()
            .HasForeignKey(x => x.RoleGroupId)
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
        builder.HasIndex(x => x.AnnouncementId);
        builder.HasIndex(x => x.TargetType);
        builder.HasIndex(x => x.BlockId);
        builder.HasIndex(x => x.UnitId);
        builder.HasIndex(x => x.RoleGroupId);
    }
}
