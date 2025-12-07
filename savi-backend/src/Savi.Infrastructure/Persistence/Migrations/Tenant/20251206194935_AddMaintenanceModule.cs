using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddMaintenanceModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MaintenanceCategory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceCategory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceCategory_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceCategory_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRequest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TicketNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    UnitId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CategoryId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RequestedForPartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "New"),
                    Priority = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Normal"),
                    Source = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "MobileApp"),
                    RequestedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DueBy = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectionReason = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CancelledByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CancellationReason = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    AssessmentSummary = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    AssessmentCompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AssessmentByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ResidentRating = table.Column<int>(type: "INTEGER", nullable: true),
                    ResidentFeedback = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    RatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRequest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_CommunityUsers_AssessmentByUserId",
                        column: x => x.AssessmentByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_CommunityUsers_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_CommunityUsers_CancelledByUserId",
                        column: x => x.CancelledByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_CommunityUsers_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_MaintenanceCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "MaintenanceCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_Party_RequestedForPartyId",
                        column: x => x.RequestedForPartyId,
                        principalTable: "Party",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequest_Unit_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceApproval",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MaintenanceRequestId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    RequestedAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    RequestedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectionReason = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CancelledByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CancellationReason = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    OwnerPaymentStatus = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "NotRequired"),
                    OwnerPaidAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    OwnerPaidAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    OwnerPaymentReference = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceApproval", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceApproval_CommunityUsers_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceApproval_CommunityUsers_CancelledByUserId",
                        column: x => x.CancelledByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceApproval_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceApproval_CommunityUsers_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceApproval_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceApproval_MaintenanceRequest_MaintenanceRequestId",
                        column: x => x.MaintenanceRequestId,
                        principalTable: "MaintenanceRequest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceComment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MaintenanceRequestId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommentType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "ResidentComment"),
                    Message = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    IsVisibleToResident = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    IsVisibleToOwner = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceComment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceComment_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceComment_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceComment_MaintenanceRequest_MaintenanceRequestId",
                        column: x => x.MaintenanceRequestId,
                        principalTable: "MaintenanceRequest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRequestDetail",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MaintenanceRequestId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LineType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Service"),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false, defaultValue: 1m),
                    UnitOfMeasure = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    EstimatedUnitPrice = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    EstimatedTotalPrice = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    IsBillable = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRequestDetail", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequestDetail_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequestDetail_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRequestDetail_MaintenanceRequest_MaintenanceRequestId",
                        column: x => x.MaintenanceRequestId,
                        principalTable: "MaintenanceRequest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_ApprovedByUserId",
                table: "MaintenanceApproval",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_CancelledByUserId",
                table: "MaintenanceApproval",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_CreatedBy",
                table: "MaintenanceApproval",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_MaintenanceRequestId",
                table: "MaintenanceApproval",
                column: "MaintenanceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_OwnerPaymentStatus",
                table: "MaintenanceApproval",
                column: "OwnerPaymentStatus");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_RequestedByUserId",
                table: "MaintenanceApproval",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_Status",
                table: "MaintenanceApproval",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceApproval_UpdatedBy",
                table: "MaintenanceApproval",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_Code",
                table: "MaintenanceCategory",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_CreatedBy",
                table: "MaintenanceCategory",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_DisplayOrder",
                table: "MaintenanceCategory",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_IsDefault",
                table: "MaintenanceCategory",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_Name",
                table: "MaintenanceCategory",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceCategory_UpdatedBy",
                table: "MaintenanceCategory",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_CommentType",
                table: "MaintenanceComment",
                column: "CommentType");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_CreatedAt",
                table: "MaintenanceComment",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_CreatedBy",
                table: "MaintenanceComment",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_IsVisibleToOwner",
                table: "MaintenanceComment",
                column: "IsVisibleToOwner");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_IsVisibleToResident",
                table: "MaintenanceComment",
                column: "IsVisibleToResident");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_MaintenanceRequestId",
                table: "MaintenanceComment",
                column: "MaintenanceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceComment_UpdatedBy",
                table: "MaintenanceComment",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_AssessmentByUserId",
                table: "MaintenanceRequest",
                column: "AssessmentByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_AssignedToUserId",
                table: "MaintenanceRequest",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_CancelledByUserId",
                table: "MaintenanceRequest",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_CategoryId",
                table: "MaintenanceRequest",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_CreatedBy",
                table: "MaintenanceRequest",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_Priority",
                table: "MaintenanceRequest",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_RequestedAt",
                table: "MaintenanceRequest",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_RequestedByUserId",
                table: "MaintenanceRequest",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_RequestedForPartyId",
                table: "MaintenanceRequest",
                column: "RequestedForPartyId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_Status",
                table: "MaintenanceRequest",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_TicketNumber",
                table: "MaintenanceRequest",
                column: "TicketNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_UnitId",
                table: "MaintenanceRequest",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequest_UpdatedBy",
                table: "MaintenanceRequest",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequestDetail_CreatedBy",
                table: "MaintenanceRequestDetail",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequestDetail_LineType",
                table: "MaintenanceRequestDetail",
                column: "LineType");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequestDetail_MaintenanceRequestId",
                table: "MaintenanceRequestDetail",
                column: "MaintenanceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequestDetail_SortOrder",
                table: "MaintenanceRequestDetail",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequestDetail_UpdatedBy",
                table: "MaintenanceRequestDetail",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaintenanceApproval");

            migrationBuilder.DropTable(
                name: "MaintenanceComment");

            migrationBuilder.DropTable(
                name: "MaintenanceRequestDetail");

            migrationBuilder.DropTable(
                name: "MaintenanceRequest");

            migrationBuilder.DropTable(
                name: "MaintenanceCategory");
        }
    }
}
