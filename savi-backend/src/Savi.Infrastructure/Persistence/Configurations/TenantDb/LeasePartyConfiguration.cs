using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for LeaseParty entity.
/// Maps to DBML: TenantDB.LeaseParty
/// </summary>
public class LeasePartyConfiguration : IEntityTypeConfiguration<LeaseParty>
{
    public void Configure(EntityTypeBuilder<LeaseParty> builder)
    {
        builder.ToTable("LeaseParty");

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
        builder.Property(x => x.LeaseId)
            .IsRequired();

        builder.Property(x => x.PartyId)
            .IsRequired();

        builder.Property(x => x.CommunityUserId);

        builder.Property(x => x.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(LeasePartyRole.PrimaryResident);

        builder.Property(x => x.IsPrimary)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.MoveInDate);

        builder.Property(x => x.MoveOutDate);

        // Foreign keys
        // Note: LeaseId FK is configured in LeaseConfiguration via HasMany

        builder.HasOne<Party>()
            .WithMany()
            .HasForeignKey(x => x.PartyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CommunityUserId)
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
        builder.HasIndex(x => x.LeaseId);
        builder.HasIndex(x => x.PartyId);
        builder.HasIndex(x => x.CommunityUserId);
        builder.HasIndex(x => new { x.LeaseId, x.PartyId });
        builder.HasIndex(x => x.IsPrimary);
        builder.HasIndex(x => x.Role);
    }
}
