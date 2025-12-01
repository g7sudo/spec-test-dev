using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Platform
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlatformUser",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirebaseUid = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FullName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    PhoneNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformUser", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformUser_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlatformUser_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Permission",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Module = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permission", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Permission_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Permission_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Plan",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    MaxRequestsPerMinute = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    DefaultListingExpiryDays = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    IsMarketplaceEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsCrossCommunityMarketplaceEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Plan_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Plan_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlatformRole",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformRole", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformRole_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlatformRole_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tenant",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AddressLine1 = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AddressLine2 = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    City = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    State = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Country = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Timezone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    PrimaryContactName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    PrimaryContactEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    PrimaryContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Provider = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ConnectionString = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenant", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tenant_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tenant_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlanFeature",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Value = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanFeature", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanFeature_Plan_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plan",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanFeature_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlanFeature_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlatformRoleBypassPermission",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformRoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Scope = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "Full"),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformRoleBypassPermission", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformRoleBypassPermission_PlatformRole_PlatformRoleId",
                        column: x => x.PlatformRoleId,
                        principalTable: "PlatformRole",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformRoleBypassPermission_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlatformRoleBypassPermission_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlatformRolePermission",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformRoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformRolePermission", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformRolePermission_Permission_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permission",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformRolePermission_PlatformRole_PlatformRoleId",
                        column: x => x.PlatformRoleId,
                        principalTable: "PlatformRole",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformRolePermission_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlatformRolePermission_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlatformUserRole",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformRoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformUserRole", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformUserRole_PlatformRole_PlatformRoleId",
                        column: x => x.PlatformRoleId,
                        principalTable: "PlatformRole",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformUserRole_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlatformUserRole_PlatformUser_PlatformUserId",
                        column: x => x.PlatformUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformUserRole_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TenantPlan",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsCurrent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantPlan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantPlan_Plan_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plan",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantPlan_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantPlan_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantPlan_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserTenantMembership",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "Invited"),
                    TenantRoleCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    InvitationToken = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    InvitationExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InvitedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTenantMembership", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserTenantMembership_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserTenantMembership_PlatformUser_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserTenantMembership_PlatformUser_PlatformUserId",
                        column: x => x.PlatformUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserTenantMembership_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserTenantMembership_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Permission_CreatedBy",
                table: "Permission",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Permission_Key",
                table: "Permission",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Permission_UpdatedBy",
                table: "Permission",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Plan_Code",
                table: "Plan",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Plan_CreatedBy",
                table: "Plan",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Plan_UpdatedBy",
                table: "Plan",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeature_CreatedBy",
                table: "PlanFeature",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeature_PlanId",
                table: "PlanFeature",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeature_UpdatedBy",
                table: "PlanFeature",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRole_Code",
                table: "PlatformRole",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRole_CreatedBy",
                table: "PlatformRole",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRole_UpdatedBy",
                table: "PlatformRole",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRoleBypassPermission_CreatedBy",
                table: "PlatformRoleBypassPermission",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRoleBypassPermission_PlatformRoleId",
                table: "PlatformRoleBypassPermission",
                column: "PlatformRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRoleBypassPermission_UpdatedBy",
                table: "PlatformRoleBypassPermission",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRolePermission_CreatedBy",
                table: "PlatformRolePermission",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRolePermission_PermissionId",
                table: "PlatformRolePermission",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRolePermission_PlatformRoleId_PermissionId",
                table: "PlatformRolePermission",
                columns: new[] { "PlatformRoleId", "PermissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformRolePermission_UpdatedBy",
                table: "PlatformRolePermission",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUser_CreatedBy",
                table: "PlatformUser",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUser_Email",
                table: "PlatformUser",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUser_FirebaseUid",
                table: "PlatformUser",
                column: "FirebaseUid",
                unique: true,
                filter: "\"FirebaseUid\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUser_UpdatedBy",
                table: "PlatformUser",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUserRole_CreatedBy",
                table: "PlatformUserRole",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUserRole_PlatformRoleId",
                table: "PlatformUserRole",
                column: "PlatformRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUserRole_PlatformUserId_PlatformRoleId",
                table: "PlatformUserRole",
                columns: new[] { "PlatformUserId", "PlatformRoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformUserRole_UpdatedBy",
                table: "PlatformUserRole",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Tenant_Code",
                table: "Tenant",
                column: "Code",
                unique: true,
                filter: "\"Code\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tenant_CreatedBy",
                table: "Tenant",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Tenant_UpdatedBy",
                table: "Tenant",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlan_CreatedBy",
                table: "TenantPlan",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlan_PlanId",
                table: "TenantPlan",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlan_TenantId",
                table: "TenantPlan",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlan_UpdatedBy",
                table: "TenantPlan",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UserTenantMembership_CreatedBy",
                table: "UserTenantMembership",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UserTenantMembership_InvitationToken",
                table: "UserTenantMembership",
                column: "InvitationToken",
                unique: true,
                filter: "\"InvitationToken\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserTenantMembership_InvitedByUserId",
                table: "UserTenantMembership",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserTenantMembership_PlatformUserId_TenantId",
                table: "UserTenantMembership",
                columns: new[] { "PlatformUserId", "TenantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserTenantMembership_TenantId",
                table: "UserTenantMembership",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_UserTenantMembership_UpdatedBy",
                table: "UserTenantMembership",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanFeature");

            migrationBuilder.DropTable(
                name: "PlatformRoleBypassPermission");

            migrationBuilder.DropTable(
                name: "PlatformRolePermission");

            migrationBuilder.DropTable(
                name: "PlatformUserRole");

            migrationBuilder.DropTable(
                name: "TenantPlan");

            migrationBuilder.DropTable(
                name: "UserTenantMembership");

            migrationBuilder.DropTable(
                name: "Permission");

            migrationBuilder.DropTable(
                name: "PlatformRole");

            migrationBuilder.DropTable(
                name: "Plan");

            migrationBuilder.DropTable(
                name: "Tenant");

            migrationBuilder.DropTable(
                name: "PlatformUser");
        }
    }
}
