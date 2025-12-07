using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for MaintenanceRequestDetail entity.
/// Maps to DBML: TenantDB.MaintenanceRequestDetail
/// </summary>
public class MaintenanceRequestDetailConfiguration : IEntityTypeConfiguration<MaintenanceRequestDetail>
{
    public void Configure(EntityTypeBuilder<MaintenanceRequestDetail> builder)
    {
        builder.ToTable("MaintenanceRequestDetail");

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

        builder.Property(x => x.LineType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MaintenanceDetailType.Service);

        builder.Property(x => x.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(x => x.Quantity)
            .IsRequired()
            .HasPrecision(18, 4)
            .HasDefaultValue(1m);

        builder.Property(x => x.UnitOfMeasure)
            .HasMaxLength(50);

        builder.Property(x => x.EstimatedUnitPrice)
            .HasPrecision(18, 2);

        builder.Property(x => x.EstimatedTotalPrice)
            .HasPrecision(18, 2);

        builder.Property(x => x.IsBillable)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.SortOrder)
            .IsRequired()
            .HasDefaultValue(0);

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
        builder.HasIndex(x => x.LineType);
        builder.HasIndex(x => x.SortOrder);
    }
}
