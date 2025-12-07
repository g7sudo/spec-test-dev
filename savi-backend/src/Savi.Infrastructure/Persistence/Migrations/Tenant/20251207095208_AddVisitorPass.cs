using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddVisitorPass : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VisitorPass",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnitId = table.Column<Guid>(type: "TEXT", nullable: false),
                    VisitType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Guest"),
                    Source = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "MobileApp"),
                    AccessCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    RequestedForUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    VisitorName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    VisitorPhone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    VisitorIdType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    VisitorIdNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    VehicleNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    VehicleType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    DeliveryProvider = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ExpectedFrom = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExpectedTo = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CheckInAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CheckOutAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CheckInByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CheckOutByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "PreRegistered"),
                    ApprovedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    RejectedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectedReason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    NotifyVisitorAtGate = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitorPass", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_CheckInByUserId",
                        column: x => x.CheckInByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_CheckOutByUserId",
                        column: x => x.CheckOutByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_RejectedByUserId",
                        column: x => x.RejectedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_RequestedForUserId",
                        column: x => x.RequestedForUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorPass_Unit_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_AccessCode",
                table: "VisitorPass",
                column: "AccessCode");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_ApprovedByUserId",
                table: "VisitorPass",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_CheckInAt",
                table: "VisitorPass",
                column: "CheckInAt");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_CheckInByUserId",
                table: "VisitorPass",
                column: "CheckInByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_CheckOutByUserId",
                table: "VisitorPass",
                column: "CheckOutByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_CreatedAt",
                table: "VisitorPass",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_CreatedBy",
                table: "VisitorPass",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_ExpectedFrom",
                table: "VisitorPass",
                column: "ExpectedFrom");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_RejectedByUserId",
                table: "VisitorPass",
                column: "RejectedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_RequestedForUserId",
                table: "VisitorPass",
                column: "RequestedForUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_Source",
                table: "VisitorPass",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_Status",
                table: "VisitorPass",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_UnitId",
                table: "VisitorPass",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_UpdatedBy",
                table: "VisitorPass",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorPass_VisitType",
                table: "VisitorPass",
                column: "VisitType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisitorPass");
        }
    }
}
