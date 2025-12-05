using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.TenantDb
{
    /// <inheritdoc />
    public partial class AddLeasesAndResidentInvites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Lease",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnitId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    StartDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    MonthlyRent = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    DepositAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ActivatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TerminationReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lease", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lease_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Lease_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Lease_Unit_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LeaseParty",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LeaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "PrimaryResident"),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    MoveInDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    MoveOutDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaseParty", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeaseParty_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LeaseParty_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LeaseParty_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LeaseParty_Lease_LeaseId",
                        column: x => x.LeaseId,
                        principalTable: "Lease",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeaseParty_Party_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Party",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ResidentInvite",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LeaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    InvitationToken = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AcceptedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CancelledByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResidentInvite", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResidentInvite_CommunityUsers_AcceptedByUserId",
                        column: x => x.AcceptedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResidentInvite_CommunityUsers_CancelledByUserId",
                        column: x => x.CancelledByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResidentInvite_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResidentInvite_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResidentInvite_Lease_LeaseId",
                        column: x => x.LeaseId,
                        principalTable: "Lease",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResidentInvite_Party_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Party",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Lease_CreatedBy",
                table: "Lease",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Lease_StartDate",
                table: "Lease",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_Lease_Status",
                table: "Lease",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Lease_UnitId",
                table: "Lease",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Lease_UnitId_Status",
                table: "Lease",
                columns: new[] { "UnitId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Lease_UpdatedBy",
                table: "Lease",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_CommunityUserId",
                table: "LeaseParty",
                column: "CommunityUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_CreatedBy",
                table: "LeaseParty",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_IsPrimary",
                table: "LeaseParty",
                column: "IsPrimary");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_LeaseId",
                table: "LeaseParty",
                column: "LeaseId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_LeaseId_PartyId",
                table: "LeaseParty",
                columns: new[] { "LeaseId", "PartyId" });

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_PartyId",
                table: "LeaseParty",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_Role",
                table: "LeaseParty",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseParty_UpdatedBy",
                table: "LeaseParty",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_AcceptedByUserId",
                table: "ResidentInvite",
                column: "AcceptedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_CancelledByUserId",
                table: "ResidentInvite",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_CreatedBy",
                table: "ResidentInvite",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_Email",
                table: "ResidentInvite",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_ExpiresAt",
                table: "ResidentInvite",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_InvitationToken",
                table: "ResidentInvite",
                column: "InvitationToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_LeaseId",
                table: "ResidentInvite",
                column: "LeaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_LeaseId_Status",
                table: "ResidentInvite",
                columns: new[] { "LeaseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_PartyId",
                table: "ResidentInvite",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_Status",
                table: "ResidentInvite",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentInvite_UpdatedBy",
                table: "ResidentInvite",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeaseParty");

            migrationBuilder.DropTable(
                name: "ResidentInvite");

            migrationBuilder.DropTable(
                name: "Lease");
        }
    }
}
