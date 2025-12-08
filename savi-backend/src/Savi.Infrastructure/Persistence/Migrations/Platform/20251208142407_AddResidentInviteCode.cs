using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Platform
{
    /// <inheritdoc />
    public partial class AddResidentInviteCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ResidentInviteCode",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccessCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TenantName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    InviteId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitationToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PartyName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UnitLabel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResidentInviteCode", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResidentInviteCode_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInviteCode_AccessCode",
                table: "ResidentInviteCode",
                column: "AccessCode",
                unique: true,
                filter: "\"Status\" = 'Active'");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInviteCode_ExpiresAt",
                table: "ResidentInviteCode",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInviteCode_InviteId",
                table: "ResidentInviteCode",
                column: "InviteId");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInviteCode_Status",
                table: "ResidentInviteCode",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInviteCode_TenantId",
                table: "ResidentInviteCode",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ResidentInviteCode");
        }
    }
}
