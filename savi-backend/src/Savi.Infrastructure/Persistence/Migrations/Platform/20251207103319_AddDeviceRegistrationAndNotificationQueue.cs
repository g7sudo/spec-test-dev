using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.Platform
{
    /// <inheritdoc />
    public partial class AddDeviceRegistrationAndNotificationQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Scope",
                table: "PlatformRoleBypassPermission",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldDefaultValue: "Full");

            migrationBuilder.CreateTable(
                name: "DeviceRegistration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DeviceId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DeviceName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AppVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OsVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    LastActiveAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TokenRefreshedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceRegistration", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceRegistration_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeviceRegistration_PlatformUser_PlatformUserId",
                        column: x => x.PlatformUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeviceRegistration_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NotificationQueue",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Body = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Data = table.Column<string>(type: "text", nullable: true),
                    SourceType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SourceTenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeduplicationKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Normal"),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    RetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MaxRetries = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextRetryAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationQueue", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationQueue_PlatformUser_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NotificationQueue_PlatformUser_PlatformUserId",
                        column: x => x.PlatformUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationQueue_PlatformUser_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NotificationQueue_Tenant_SourceTenantId",
                        column: x => x.SourceTenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PlatformAuditLog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Action = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    OldValues = table.Column<string>(type: "jsonb", nullable: true),
                    NewValues = table.Column<string>(type: "jsonb", nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformAuditLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformAuditLog_PlatformUser_PlatformUserId",
                        column: x => x.PlatformUserId,
                        principalTable: "PlatformUser",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PlatformAuditLog_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistration_CreatedBy",
                table: "DeviceRegistration",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistration_DeviceId_PlatformUserId",
                table: "DeviceRegistration",
                columns: new[] { "DeviceId", "PlatformUserId" },
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistration_DeviceToken",
                table: "DeviceRegistration",
                column: "DeviceToken",
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistration_LastActiveAt",
                table: "DeviceRegistration",
                column: "LastActiveAt");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistration_PlatformUserId_IsActive",
                table: "DeviceRegistration",
                columns: new[] { "PlatformUserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistration_UpdatedBy",
                table: "DeviceRegistration",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_CreatedBy",
                table: "NotificationQueue",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_Deduplication",
                table: "NotificationQueue",
                columns: new[] { "DeduplicationKey", "CreatedAt" },
                filter: "\"DeduplicationKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_Expiration",
                table: "NotificationQueue",
                columns: new[] { "Status", "ExpiresAt" },
                filter: "\"Status\" = 'Pending' AND \"ExpiresAt\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_PlatformUserId_CreatedAt",
                table: "NotificationQueue",
                columns: new[] { "PlatformUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_Processing",
                table: "NotificationQueue",
                columns: new[] { "Status", "Priority", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_Retry",
                table: "NotificationQueue",
                columns: new[] { "Status", "NextRetryAt" },
                filter: "\"Status\" = 'Pending' AND \"NextRetryAt\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_SourceTenantId_CreatedAt",
                table: "NotificationQueue",
                columns: new[] { "SourceTenantId", "CreatedAt" },
                filter: "\"SourceTenantId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationQueue_UpdatedBy",
                table: "NotificationQueue",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_Action",
                table: "PlatformAuditLog",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_CorrelationId",
                table: "PlatformAuditLog",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_EntityType",
                table: "PlatformAuditLog",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_EntityType_EntityId",
                table: "PlatformAuditLog",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_PlatformUserId",
                table: "PlatformAuditLog",
                column: "PlatformUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_TenantId",
                table: "PlatformAuditLog",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformAuditLog_Timestamp",
                table: "PlatformAuditLog",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceRegistration");

            migrationBuilder.DropTable(
                name: "NotificationQueue");

            migrationBuilder.DropTable(
                name: "PlatformAuditLog");

            migrationBuilder.AlterColumn<string>(
                name: "Scope",
                table: "PlatformRoleBypassPermission",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Full",
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);
        }
    }
}
