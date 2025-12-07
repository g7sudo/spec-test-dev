using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for CampaignTargetTenant entity.
/// </summary>
public class CampaignTargetTenantConfiguration : IEntityTypeConfiguration<CampaignTargetTenant>
{
    public void Configure(EntityTypeBuilder<CampaignTargetTenant> builder)
    {
        builder.ToTable("CampaignTargetTenant");

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
        builder.Property(x => x.CampaignId)
            .IsRequired();

        builder.Property(x => x.TenantId)
            .IsRequired();

        // Indexes
        builder.HasIndex(x => x.CampaignId);
        builder.HasIndex(x => x.TenantId);
        builder.HasIndex(x => new { x.CampaignId, x.TenantId })
            .IsUnique()
            .HasFilter("\"IsActive\" = true");

        // Foreign keys
        builder.HasOne(x => x.Campaign)
            .WithMany(c => c.TargetTenants)
            .HasForeignKey(x => x.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<PlatformUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<PlatformUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
