using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.TenantDb
{
    /// <inheritdoc />
    public partial class AddAppSettingsToCommunityUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BiometricEnabled",
                table: "CommunityUserProfile",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Locale",
                table: "CommunityUserProfile",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Theme",
                table: "CommunityUserProfile",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BiometricEnabled",
                table: "CommunityUserProfile");

            migrationBuilder.DropColumn(
                name: "Locale",
                table: "CommunityUserProfile");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "CommunityUserProfile");
        }
    }
}
