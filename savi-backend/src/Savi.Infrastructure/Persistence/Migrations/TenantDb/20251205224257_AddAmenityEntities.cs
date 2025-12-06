using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.TenantDb
{
    /// <inheritdoc />
    public partial class AddAmenityEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Amenity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Other"),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Active"),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    LocationText = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsVisibleInApp = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    IsBookable = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    RequiresApproval = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SlotDurationMinutes = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 60),
                    OpenTime = table.Column<TimeOnly>(type: "TEXT", nullable: true),
                    CloseTime = table.Column<TimeOnly>(type: "TEXT", nullable: true),
                    CleanupBufferMinutes = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    MaxDaysInAdvance = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 30),
                    MaxActiveBookingsPerUnit = table.Column<int>(type: "INTEGER", nullable: true),
                    MaxGuests = table.Column<int>(type: "INTEGER", nullable: true),
                    DepositRequired = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    DepositAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Amenity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Amenity_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Amenity_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AmenityBlackout",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AmenityId = table.Column<Guid>(type: "TEXT", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    AutoCancelBookings = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmenityBlackout", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AmenityBlackout_Amenity_AmenityId",
                        column: x => x.AmenityId,
                        principalTable: "Amenity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AmenityBlackout_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBlackout_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AmenityBooking",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AmenityId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnitId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BookedForUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    StartAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "PendingApproval"),
                    Source = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "MobileApp"),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    AdminNotes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    NumberOfGuests = table.Column<int>(type: "INTEGER", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ApprovedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    RejectedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    RejectionReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CancelledByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CancellationReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DepositRequired = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    DepositAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    DepositStatus = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "NotRequired"),
                    DepositReference = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmenityBooking", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_Amenity_AmenityId",
                        column: x => x.AmenityId,
                        principalTable: "Amenity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_CommunityUsers_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_CommunityUsers_BookedForUserId",
                        column: x => x.BookedForUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_CommunityUsers_CancelledByUserId",
                        column: x => x.CancelledByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_CommunityUsers_RejectedByUserId",
                        column: x => x.RejectedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AmenityBooking_Unit_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_Code",
                table: "Amenity",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_CreatedBy",
                table: "Amenity",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_DisplayOrder",
                table: "Amenity",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_IsBookable",
                table: "Amenity",
                column: "IsBookable");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_Name",
                table: "Amenity",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_Status",
                table: "Amenity",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_Type",
                table: "Amenity",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Amenity_UpdatedBy",
                table: "Amenity",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBlackout_AmenityId",
                table: "AmenityBlackout",
                column: "AmenityId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBlackout_AmenityId_StartDate_EndDate",
                table: "AmenityBlackout",
                columns: new[] { "AmenityId", "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBlackout_CreatedBy",
                table: "AmenityBlackout",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBlackout_EndDate",
                table: "AmenityBlackout",
                column: "EndDate");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBlackout_StartDate",
                table: "AmenityBlackout",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBlackout_UpdatedBy",
                table: "AmenityBlackout",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_AmenityId",
                table: "AmenityBooking",
                column: "AmenityId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_AmenityId_StartAt_EndAt",
                table: "AmenityBooking",
                columns: new[] { "AmenityId", "StartAt", "EndAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_AmenityId_Status",
                table: "AmenityBooking",
                columns: new[] { "AmenityId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_ApprovedByUserId",
                table: "AmenityBooking",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_BookedForUserId",
                table: "AmenityBooking",
                column: "BookedForUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_CancelledByUserId",
                table: "AmenityBooking",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_CreatedBy",
                table: "AmenityBooking",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_EndAt",
                table: "AmenityBooking",
                column: "EndAt");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_RejectedByUserId",
                table: "AmenityBooking",
                column: "RejectedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_StartAt",
                table: "AmenityBooking",
                column: "StartAt");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_Status",
                table: "AmenityBooking",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_UnitId",
                table: "AmenityBooking",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_UnitId_Status",
                table: "AmenityBooking",
                columns: new[] { "UnitId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AmenityBooking_UpdatedBy",
                table: "AmenityBooking",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AmenityBlackout");

            migrationBuilder.DropTable(
                name: "AmenityBooking");

            migrationBuilder.DropTable(
                name: "Amenity");
        }
    }
}
