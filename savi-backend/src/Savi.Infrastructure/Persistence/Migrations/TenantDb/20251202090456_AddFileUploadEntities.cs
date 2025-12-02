using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.TenantDb
{
    /// <inheritdoc />
    public partial class AddFileUploadEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlatformUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    PreferredName = table.Column<string>(type: "TEXT", nullable: true),
                    Timezone = table.Column<string>(type: "TEXT", nullable: true),
                    Locale = table.Column<string>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoleGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    GroupType = table.Column<int>(type: "INTEGER", nullable: false),
                    IsSystem = table.Column<bool>(type: "INTEGER", nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Block",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Block", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Block_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Block_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Document",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OwnerType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    OwnerId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    BlobPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    SizeBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Document", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Document_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Document_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TempFileUpload",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TempKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BlobPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    SizeBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TempFileUpload", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TempFileUpload_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TempFileUpload_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TempFileUpload_CommunityUsers_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UnitType",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    DefaultParkingSlots = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    DefaultOccupancyLimit = table.Column<int>(type: "INTEGER", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitType", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitType_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UnitType_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityUserRoleGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RoleGroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ValidTo = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityUserRoleGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityUserRoleGroups_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityUserRoleGroups_RoleGroups_RoleGroupId",
                        column: x => x.RoleGroupId,
                        principalTable: "RoleGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoleGroupPermissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    RoleGroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PermissionKey = table.Column<string>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleGroupPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleGroupPermissions_RoleGroups_RoleGroupId",
                        column: x => x.RoleGroupId,
                        principalTable: "RoleGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Floor",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BlockId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    LevelNumber = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Floor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Floor_Block_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Block",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Floor_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Floor_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Unit",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BlockId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FloorId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnitTypeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnitNumber = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    AreaSqft = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Unit", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Unit_Block_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Block",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Unit_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Unit_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Unit_Floor_FloorId",
                        column: x => x.FloorId,
                        principalTable: "Floor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Unit_UnitType_UnitTypeId",
                        column: x => x.UnitTypeId,
                        principalTable: "UnitType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ParkingSlot",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    LocationType = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    LevelLabel = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    IsCovered = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsEVCompatible = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    AllocatedUnitId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingSlot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingSlot_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ParkingSlot_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ParkingSlot_Unit_AllocatedUnitId",
                        column: x => x.AllocatedUnitId,
                        principalTable: "Unit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Block_CreatedBy",
                table: "Block",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Block_DisplayOrder",
                table: "Block",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Block_Name",
                table: "Block",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Block_UpdatedBy",
                table: "Block",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserRoleGroups_CommunityUserId",
                table: "CommunityUserRoleGroups",
                column: "CommunityUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserRoleGroups_RoleGroupId",
                table: "CommunityUserRoleGroups",
                column: "RoleGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Document_Category",
                table: "Document",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Document_CreatedBy",
                table: "Document",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Document_OwnerType",
                table: "Document",
                column: "OwnerType");

            migrationBuilder.CreateIndex(
                name: "IX_Document_OwnerType_OwnerId",
                table: "Document",
                columns: new[] { "OwnerType", "OwnerId" });

            migrationBuilder.CreateIndex(
                name: "IX_Document_OwnerType_OwnerId_DisplayOrder",
                table: "Document",
                columns: new[] { "OwnerType", "OwnerId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Document_UpdatedBy",
                table: "Document",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Floor_BlockId",
                table: "Floor",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_Floor_BlockId_DisplayOrder",
                table: "Floor",
                columns: new[] { "BlockId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Floor_CreatedBy",
                table: "Floor",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Floor_UpdatedBy",
                table: "Floor",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_AllocatedUnitId",
                table: "ParkingSlot",
                column: "AllocatedUnitId",
                filter: "\"AllocatedUnitId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_Code",
                table: "ParkingSlot",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_CreatedBy",
                table: "ParkingSlot",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_Status",
                table: "ParkingSlot",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_UpdatedBy",
                table: "ParkingSlot",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_RoleGroupPermissions_RoleGroupId",
                table: "RoleGroupPermissions",
                column: "RoleGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_CreatedAt",
                table: "TempFileUpload",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_CreatedBy",
                table: "TempFileUpload",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_TempKey",
                table: "TempFileUpload",
                column: "TempKey");

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_TenantId",
                table: "TempFileUpload",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_TenantId_TempKey",
                table: "TempFileUpload",
                columns: new[] { "TenantId", "TempKey" });

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_UpdatedBy",
                table: "TempFileUpload",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TempFileUpload_UploadedByUserId",
                table: "TempFileUpload",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Unit_BlockId",
                table: "Unit",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_Unit_BlockId_FloorId_UnitNumber",
                table: "Unit",
                columns: new[] { "BlockId", "FloorId", "UnitNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_Unit_CreatedBy",
                table: "Unit",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Unit_FloorId",
                table: "Unit",
                column: "FloorId");

            migrationBuilder.CreateIndex(
                name: "IX_Unit_Status",
                table: "Unit",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Unit_UnitTypeId",
                table: "Unit",
                column: "UnitTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Unit_UpdatedBy",
                table: "Unit",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UnitType_Code",
                table: "UnitType",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UnitType_CreatedBy",
                table: "UnitType",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UnitType_UpdatedBy",
                table: "UnitType",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityUserRoleGroups");

            migrationBuilder.DropTable(
                name: "Document");

            migrationBuilder.DropTable(
                name: "ParkingSlot");

            migrationBuilder.DropTable(
                name: "RoleGroupPermissions");

            migrationBuilder.DropTable(
                name: "TempFileUpload");

            migrationBuilder.DropTable(
                name: "Unit");

            migrationBuilder.DropTable(
                name: "RoleGroups");

            migrationBuilder.DropTable(
                name: "Floor");

            migrationBuilder.DropTable(
                name: "UnitType");

            migrationBuilder.DropTable(
                name: "Block");

            migrationBuilder.DropTable(
                name: "CommunityUsers");
        }
    }
}
