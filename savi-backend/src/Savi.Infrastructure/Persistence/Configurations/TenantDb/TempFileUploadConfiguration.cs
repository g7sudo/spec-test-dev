using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.Configurations.TenantDb;

/// <summary>
/// EF Core configuration for TempFileUpload entity.
/// Maps temporary file uploads before entity creation.
/// </summary>
public class TempFileUploadConfiguration : IEntityTypeConfiguration<TempFileUpload>
{
    public void Configure(EntityTypeBuilder<TempFileUpload> builder)
    {
        builder.ToTable("TempFileUpload");

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
        builder.Property(x => x.TenantId)
            .IsRequired();

        builder.Property(x => x.TempKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.UploadedByUserId)
            .IsRequired();

        builder.Property(x => x.BlobPath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.FileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.ContentType)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.SizeBytes)
            .IsRequired();

        builder.Property(x => x.ExpiresAt)
            .IsRequired();

        // Foreign keys
        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityUser>()
            .WithMany()
            .HasForeignKey(x => x.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for fast lookups
        builder.HasIndex(x => x.TempKey);
        builder.HasIndex(x => x.TenantId);
        builder.HasIndex(x => x.UploadedByUserId);
        builder.HasIndex(x => x.CreatedAt); // For cleanup queries
        builder.HasIndex(x => new { x.TenantId, x.TempKey });
    }
}
