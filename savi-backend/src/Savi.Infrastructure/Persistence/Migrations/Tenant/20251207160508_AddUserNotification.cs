using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddUserNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserNotification",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "General"),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    ReadAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ActionUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ReferenceType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ReferenceId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ImageUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    DataPayload = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotification", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotification_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_Category",
                table: "UserNotification",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_CommunityUserId",
                table: "UserNotification",
                column: "CommunityUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_CommunityUserId_CreatedAt",
                table: "UserNotification",
                columns: new[] { "CommunityUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_CommunityUserId_IsRead",
                table: "UserNotification",
                columns: new[] { "CommunityUserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_CreatedAt",
                table: "UserNotification",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_IsRead",
                table: "UserNotification",
                column: "IsRead");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserNotification");
        }
    }
}
