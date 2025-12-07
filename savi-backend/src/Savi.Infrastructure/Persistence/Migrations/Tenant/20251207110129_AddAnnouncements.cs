using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddAnnouncements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Announcement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 10000, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "General"),
                    Priority = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Normal"),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    PublishedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ScheduledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsPinned = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsBanner = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    AllowLikes = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    AllowComments = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    AllowAddToCalendar = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsEvent = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    EventStartAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EventEndAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsAllDay = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    EventLocationText = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    EventJoinUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcement", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Announcement_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Announcement_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementAudience",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AnnouncementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TargetType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Community"),
                    BlockId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UnitId = table.Column<Guid>(type: "TEXT", nullable: true),
                    RoleGroupId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementAudience", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementAudience_Announcement_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcement",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementAudience_Block_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Block",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementAudience_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementAudience_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementAudience_RoleGroups_RoleGroupId",
                        column: x => x.RoleGroupId,
                        principalTable: "RoleGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementAudience_Unit_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementComment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AnnouncementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    IsHidden = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    ParentCommentId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementComment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementComment_AnnouncementComment_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "AnnouncementComment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementComment_Announcement_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcement",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementComment_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementComment_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementComment_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementLike",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AnnouncementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementLike", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementLike_Announcement_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcement",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementLike_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementLike_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementLike_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementRead",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AnnouncementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementRead", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementRead_Announcement_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcement",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementRead_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementRead_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementRead_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_Category",
                table: "Announcement",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_CreatedAt",
                table: "Announcement",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_CreatedBy",
                table: "Announcement",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_ExpiresAt",
                table: "Announcement",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_IsEvent",
                table: "Announcement",
                column: "IsEvent");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_IsPinned",
                table: "Announcement",
                column: "IsPinned");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_Priority",
                table: "Announcement",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_PublishedAt",
                table: "Announcement",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_ScheduledAt",
                table: "Announcement",
                column: "ScheduledAt");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_Status",
                table: "Announcement",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_UpdatedBy",
                table: "Announcement",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_AnnouncementId",
                table: "AnnouncementAudience",
                column: "AnnouncementId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_BlockId",
                table: "AnnouncementAudience",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_CreatedBy",
                table: "AnnouncementAudience",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_RoleGroupId",
                table: "AnnouncementAudience",
                column: "RoleGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_TargetType",
                table: "AnnouncementAudience",
                column: "TargetType");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_UnitId",
                table: "AnnouncementAudience",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementAudience_UpdatedBy",
                table: "AnnouncementAudience",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_AnnouncementId",
                table: "AnnouncementComment",
                column: "AnnouncementId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_CommunityUserId",
                table: "AnnouncementComment",
                column: "CommunityUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_CreatedAt",
                table: "AnnouncementComment",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_CreatedBy",
                table: "AnnouncementComment",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_IsHidden",
                table: "AnnouncementComment",
                column: "IsHidden");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_ParentCommentId",
                table: "AnnouncementComment",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComment_UpdatedBy",
                table: "AnnouncementComment",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementLike_AnnouncementId",
                table: "AnnouncementLike",
                column: "AnnouncementId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementLike_AnnouncementId_CommunityUserId",
                table: "AnnouncementLike",
                columns: new[] { "AnnouncementId", "CommunityUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementLike_CommunityUserId",
                table: "AnnouncementLike",
                column: "CommunityUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementLike_CreatedBy",
                table: "AnnouncementLike",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementLike_UpdatedBy",
                table: "AnnouncementLike",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRead_AnnouncementId",
                table: "AnnouncementRead",
                column: "AnnouncementId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRead_AnnouncementId_CommunityUserId",
                table: "AnnouncementRead",
                columns: new[] { "AnnouncementId", "CommunityUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRead_CommunityUserId",
                table: "AnnouncementRead",
                column: "CommunityUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRead_CreatedBy",
                table: "AnnouncementRead",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRead_ReadAt",
                table: "AnnouncementRead",
                column: "ReadAt");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRead_UpdatedBy",
                table: "AnnouncementRead",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementAudience");

            migrationBuilder.DropTable(
                name: "AnnouncementComment");

            migrationBuilder.DropTable(
                name: "AnnouncementLike");

            migrationBuilder.DropTable(
                name: "AnnouncementRead");

            migrationBuilder.DropTable(
                name: "Announcement");
        }
    }
}
