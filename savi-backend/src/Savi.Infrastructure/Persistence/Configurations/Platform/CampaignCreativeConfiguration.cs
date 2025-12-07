using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.Platform;

/// <summary>
/// EF Core configuration for CampaignCreative entity.
/// </summary>
public class CampaignCreativeConfiguration : IEntityTypeConfiguration<CampaignCreative>
{
    public void Configure(EntityTypeBuilder<CampaignCreative> builder)
    {
        builder.ToTable("CampaignCreative");

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

        builder.Property(x => x.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.Placement)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.SizeCode)
            .HasMaxLength(50);

        builder.Property(x => x.Sequence);

        builder.Property(x => x.MediaUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(x => x.Caption)
            .HasMaxLength(500);

        builder.Property(x => x.CTAType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(CTAType.None);

        builder.Property(x => x.CTAValue)
            .HasMaxLength(500);

        // Indexes
        builder.HasIndex(x => x.CampaignId);
        builder.HasIndex(x => x.Type);
        builder.HasIndex(x => x.Placement);
        builder.HasIndex(x => new { x.CampaignId, x.Type, x.Sequence })
            .HasDatabaseName("IX_CampaignCreative_Ordering");
        builder.HasIndex(x => x.IsActive);

        // Foreign keys
        builder.HasOne(x => x.Campaign)
            .WithMany(c => c.Creatives)
            .HasForeignKey(x => x.CampaignId)
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
