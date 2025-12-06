using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for Amenity entity.
/// Maps to DBML: TenantDB.Amenity
/// </summary>
public class AmenityConfiguration : IEntityTypeConfiguration<Amenity>
{
    public void Configure(EntityTypeBuilder<Amenity> builder)
    {
        builder.ToTable("Amenity");

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
        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Code)
            .HasMaxLength(50);

        builder.Property(x => x.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AmenityType.Other);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(AmenityStatus.Active);

        builder.Property(x => x.Description)
            .HasMaxLength(2000);

        builder.Property(x => x.LocationText)
            .HasMaxLength(500);

        builder.Property(x => x.IsVisibleInApp)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        // Booking rules
        builder.Property(x => x.IsBookable)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.RequiresApproval)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.SlotDurationMinutes)
            .IsRequired()
            .HasDefaultValue(60);

        builder.Property(x => x.OpenTime);

        builder.Property(x => x.CloseTime);

        builder.Property(x => x.CleanupBufferMinutes)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.MaxDaysInAdvance)
            .IsRequired()
            .HasDefaultValue(30);

        builder.Property(x => x.MaxActiveBookingsPerUnit);

        builder.Property(x => x.MaxGuests);

        builder.Property(x => x.DepositRequired)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.DepositAmount)
            .HasPrecision(18, 2);

        // Foreign keys - CreatedBy/UpdatedBy to CommunityUser
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => x.Code);
        builder.HasIndex(x => x.Type);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.IsBookable);
        builder.HasIndex(x => x.DisplayOrder);
    }
}
