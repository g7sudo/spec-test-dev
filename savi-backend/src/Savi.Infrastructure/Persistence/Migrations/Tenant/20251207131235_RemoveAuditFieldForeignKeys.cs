using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class RemoveAuditFieldForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceCategory_CommunityUsers_CreatedBy",
                table: "MaintenanceCategory");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceCategory_CommunityUsers_UpdatedBy",
                table: "MaintenanceCategory");

            migrationBuilder.DropForeignKey(
                name: "FK_UnitType_CommunityUsers_CreatedBy",
                table: "UnitType");

            migrationBuilder.DropForeignKey(
                name: "FK_UnitType_CommunityUsers_UpdatedBy",
                table: "UnitType");

            migrationBuilder.DropIndex(
                name: "IX_UnitType_CreatedBy",
                table: "UnitType");

            migrationBuilder.DropIndex(
                name: "IX_UnitType_UpdatedBy",
                table: "UnitType");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceCategory_CreatedBy",
                table: "MaintenanceCategory");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceCategory_UpdatedBy",
                table: "MaintenanceCategory");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_UnitType_CreatedBy",
                table: "UnitType",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UnitType_UpdatedBy",
                table: "UnitType",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_CreatedBy",
                table: "MaintenanceCategory",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_UpdatedBy",
                table: "MaintenanceCategory",
                column: "UpdatedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceCategory_CommunityUsers_CreatedBy",
                table: "MaintenanceCategory",
                column: "CreatedBy",
                principalTable: "CommunityUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceCategory_CommunityUsers_UpdatedBy",
                table: "MaintenanceCategory",
                column: "UpdatedBy",
                principalTable: "CommunityUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UnitType_CommunityUsers_CreatedBy",
                table: "UnitType",
                column: "CreatedBy",
                principalTable: "CommunityUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UnitType_CommunityUsers_UpdatedBy",
                table: "UnitType",
                column: "UpdatedBy",
                principalTable: "CommunityUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
