using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddUnitOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UnitOwnership",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnitId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OwnershipShare = table.Column<decimal>(type: "TEXT", precision: 5, scale: 2, nullable: false, defaultValue: 100m),
                    FromDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    ToDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    IsPrimaryOwner = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitOwnership", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitOwnership_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UnitOwnership_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UnitOwnership_Party_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Party",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UnitOwnership_Unit_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UnitOwnership_CreatedBy",
                table: "UnitOwnership",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UnitOwnership_IsPrimaryOwner",
                table: "UnitOwnership",
                column: "IsPrimaryOwner");

            migrationBuilder.CreateIndex(
                name: "IX_UnitOwnership_PartyId",
                table: "UnitOwnership",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitOwnership_UnitId",
                table: "UnitOwnership",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitOwnership_UnitId_PartyId_FromDate",
                table: "UnitOwnership",
                columns: new[] { "UnitId", "PartyId", "FromDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UnitOwnership_UpdatedBy",
                table: "UnitOwnership",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UnitOwnership");
        }
    }
}
