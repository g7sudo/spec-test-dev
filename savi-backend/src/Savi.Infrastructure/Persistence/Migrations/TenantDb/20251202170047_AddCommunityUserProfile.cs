using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Savi.Infrastructure.Persistence.Migrations.TenantDb
{
    /// <inheritdoc />
    public partial class AddCommunityUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityUserProfile",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CommunityUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    AboutMe = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ProfilePhotoDocumentId = table.Column<Guid>(type: "TEXT", nullable: true),
                    DirectoryVisibility = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "Community"),
                    ShowInDirectory = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    ShowNameInDirectory = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    ShowUnitInDirectory = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    ShowPhoneInDirectory = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    ShowEmailInDirectory = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    ShowProfilePhotoInDirectory = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    PushEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    EmailEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    NotifyMaintenanceUpdates = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    NotifyAmenityBookings = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    NotifyVisitorAtGate = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    NotifyAnnouncements = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    NotifyMarketplace = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityUserProfile", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityUserProfile_CommunityUsers_CommunityUserId",
                        column: x => x.CommunityUserId,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityUserProfile_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityUserProfile_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityUserProfile_Document_ProfilePhotoDocumentId",
                        column: x => x.ProfilePhotoDocumentId,
                        principalTable: "Document",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Party",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    PartyName = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    LegalName = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    FirstName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    LastName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    RegistrationNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    TaxNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
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
                    table.PrimaryKey("PK_Party", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Party_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Party_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PartyAddress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AddressType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Line1 = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Line2 = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    State = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Country = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    PostalCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartyAddress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartyAddress_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartyAddress_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartyAddress_Party_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Party",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PartyContact",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PartyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ContactType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Value = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsVerified = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartyContact", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartyContact_CommunityUsers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartyContact_CommunityUsers_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "CommunityUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartyContact_Party_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Party",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserProfile_CommunityUserId",
                table: "CommunityUserProfile",
                column: "CommunityUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserProfile_CreatedBy",
                table: "CommunityUserProfile",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserProfile_IsActive",
                table: "CommunityUserProfile",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserProfile_ProfilePhotoDocumentId",
                table: "CommunityUserProfile",
                column: "ProfilePhotoDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityUserProfile_UpdatedBy",
                table: "CommunityUserProfile",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Party_CreatedBy",
                table: "Party",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Party_IsActive",
                table: "Party",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Party_PartyName",
                table: "Party",
                column: "PartyName");

            migrationBuilder.CreateIndex(
                name: "IX_Party_PartyType",
                table: "Party",
                column: "PartyType");

            migrationBuilder.CreateIndex(
                name: "IX_Party_UpdatedBy",
                table: "Party",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PartyAddress_AddressType",
                table: "PartyAddress",
                column: "AddressType");

            migrationBuilder.CreateIndex(
                name: "IX_PartyAddress_CreatedBy",
                table: "PartyAddress",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PartyAddress_IsActive",
                table: "PartyAddress",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PartyAddress_IsPrimary",
                table: "PartyAddress",
                column: "IsPrimary");

            migrationBuilder.CreateIndex(
                name: "IX_PartyAddress_PartyId",
                table: "PartyAddress",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_PartyAddress_UpdatedBy",
                table: "PartyAddress",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_ContactType",
                table: "PartyContact",
                column: "ContactType");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_CreatedBy",
                table: "PartyContact",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_IsActive",
                table: "PartyContact",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_IsPrimary",
                table: "PartyContact",
                column: "IsPrimary");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_IsVerified",
                table: "PartyContact",
                column: "IsVerified");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_PartyId",
                table: "PartyContact",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_PartyId_ContactType_IsPrimary",
                table: "PartyContact",
                columns: new[] { "PartyId", "ContactType", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_PartyContact_UpdatedBy",
                table: "PartyContact",
                column: "UpdatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityUserProfile");

            migrationBuilder.DropTable(
                name: "PartyAddress");

            migrationBuilder.DropTable(
                name: "PartyContact");

            migrationBuilder.DropTable(
                name: "Party");
        }
    }
}
