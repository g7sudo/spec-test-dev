using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.Tenant;

/// <summary>
/// EF Core configuration for CommunityUserRoleGroup entity.
/// Maps to DBML: TenantDB.CommunityUserRoleGroup
/// </summary>
public class CommunityUserRoleGroupConfiguration : IEntityTypeConfiguration<CommunityUserRoleGroup>
{
    public void Configure(EntityTypeBuilder<CommunityUserRoleGroup> builder)
    {
        builder.ToTable("CommunityUserRoleGroup");

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
        builder.Property(x => x.CommunityUserId).IsRequired();
        builder.Property(x => x.RoleGroupId).IsRequired();
        builder.Property(x => x.IsPrimary).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.ValidFrom);
        builder.Property(x => x.ValidTo);

        // Foreign keys
        builder.HasOne(x => x.CommunityUser)
            .WithMany(x => x.RoleGroups)
            .HasForeignKey(x => x.CommunityUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.RoleGroup)
            .WithMany(x => x.UserRoleGroups)
            .HasForeignKey(x => x.RoleGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique index on (CommunityUserId, RoleGroupId)
        builder.HasIndex(x => new { x.CommunityUserId, x.RoleGroupId }).IsUnique();
    }
}

