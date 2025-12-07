using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Platform
{
    /// <inheritdoc />
    public partial class AddAdsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Advertiser",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContactName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Advertiser", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Advertiser_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Advertiser_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Campaign",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdvertiserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Draft"),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxImpressions = table.Column<int>(type: "integer", nullable: true),
                    MaxClicks = table.Column<int>(type: "integer", nullable: true),
                    DailyImpressionCap = table.Column<int>(type: "integer", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaign", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Campaign_Advertiser_AdvertiserId",
                        column: x => x.AdvertiserId,
                        principalTable: "Advertiser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Campaign_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Campaign_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CampaignCreative",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Placement = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    SizeCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Sequence = table.Column<int>(type: "integer", nullable: true),
                    MediaUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Caption = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CTAType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "None"),
                    CTAValue = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignCreative", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignCreative_Campaign_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaign",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignCreative_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CampaignCreative_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CampaignTargetTenant",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignTargetTenant", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignTargetTenant_Campaign_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaign",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignTargetTenant_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CampaignTargetTenant_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CampaignTargetTenant_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AdEvent",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreativeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Screen = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Placement = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdEvent", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdEvent_CampaignCreative_CreativeId",
                        column: x => x.CreativeId,
                        principalTable: "CampaignCreative",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdEvent_Campaign_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaign",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdEvent_PlatformUser_PlatformUserId",
                        column: x => x.PlatformUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AdEvent_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdEvent_CampaignAnalytics",
                table: "AdEvent",
                columns: new[] { "CampaignId", "EventType", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdEvent_CreativeAnalytics",
                table: "AdEvent",
                columns: new[] { "CreativeId", "EventType", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdEvent_Deduplication",
                table: "AdEvent",
                columns: new[] { "PlatformUserId", "CreativeId", "EventType", "OccurredAt" },
                filter: "\"PlatformUserId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AdEvent_OccurredAt",
                table: "AdEvent",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_AdEvent_TenantAnalytics",
                table: "AdEvent",
                columns: new[] { "TenantId", "EventType", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdEvent_UserAnalytics",
                table: "AdEvent",
                columns: new[] { "PlatformUserId", "EventType", "OccurredAt" },
                filter: "\"PlatformUserId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Advertiser_CreatedBy",
                table: "Advertiser",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Advertiser_IsActive",
                table: "Advertiser",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Advertiser_Name",
                table: "Advertiser",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Advertiser_UpdatedBy",
                table: "Advertiser",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_ActiveDateRange",
                table: "Campaign",
                columns: new[] { "Status", "StartsAt", "EndsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_AdvertiserId",
                table: "Campaign",
                column: "AdvertiserId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_CreatedBy",
                table: "Campaign",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_IsActive",
                table: "Campaign",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_Priority",
                table: "Campaign",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_Status",
                table: "Campaign",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_Type",
                table: "Campaign",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Campaign_UpdatedBy",
                table: "Campaign",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_CampaignId",
                table: "CampaignCreative",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_CreatedBy",
                table: "CampaignCreative",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_IsActive",
                table: "CampaignCreative",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_Ordering",
                table: "CampaignCreative",
                columns: new[] { "CampaignId", "Type", "Sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_Placement",
                table: "CampaignCreative",
                column: "Placement");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_Type",
                table: "CampaignCreative",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignCreative_UpdatedBy",
                table: "CampaignCreative",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTargetTenant_CampaignId",
                table: "CampaignTargetTenant",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTargetTenant_CampaignId_TenantId",
                table: "CampaignTargetTenant",
                columns: new[] { "CampaignId", "TenantId" },
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTargetTenant_CreatedBy",
                table: "CampaignTargetTenant",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTargetTenant_TenantId",
                table: "CampaignTargetTenant",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTargetTenant_UpdatedBy",
                table: "CampaignTargetTenant",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdEvent");

            migrationBuilder.DropTable(
                name: "CampaignTargetTenant");

            migrationBuilder.DropTable(
                name: "CampaignCreative");

            migrationBuilder.DropTable(
                name: "Campaign");

            migrationBuilder.DropTable(
                name: "Advertiser");
        }
    }
}
