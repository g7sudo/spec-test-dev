Here's a comprehensive project structure that follows your architecture guidelines:

## Solution Structure

```
Savi.sln
├── src/
│   ├── Savi.Api/
│   ├── Savi.Application/
│   ├── Savi.Domain/
│   ├── Savi.Infrastructure/
│   ├── Savi.MultiTenancy/
│   ├── Savi.SharedKernel/
│   └── Savi.BackgroundJobs/
├── tests/
│   ├── Savi.UnitTests/
│   ├── Savi.IntegrationTests/
│   └── Savi.ArchitectureTests/
└── docs/
    ├── architecture-guideline.md
    ├── tenant-db.txt
    └── platform-db.txt
```

## Detailed Project Breakdown

### 1. **Savi.Domain** (Pure Domain Model)

```
Savi.Domain/
├── Common/
│   ├── BaseEntity.cs
│   ├── IAuditableEntity.cs
│   ├── IDomainEvent.cs
│   └── DomainException.cs
├── Platform/
│   ├── Entities/
│   │   ├── PlatformUser.cs
│   │   ├── Tenant.cs
│   │   ├── UserTenantMembership.cs
│   │   ├── Plan.cs
│   │   ├── PlanFeature.cs
│   │   ├── TenantPlan.cs
│   │   ├── Permission.cs
│   │   ├── PlatformRole.cs
│   │   ├── PlatformRolePermission.cs
│   │   ├── PlatformUserRole.cs
│   │   ├── PlatformRoleBypassPermission.cs
│   │   └── PlatformAuditLog.cs
│   ├── Enums/
│   │   ├── TenantStatus.cs
│   │   ├── MembershipStatus.cs
│   │   └── BypassScope.cs
│   └── Events/
│       ├── TenantCreatedEvent.cs
│       └── UserInvitedEvent.cs
├── Community/
│   ├── Entities/
│   │   ├── Party.cs
│   │   ├── PartyAddress.cs
│   │   ├── PartyContact.cs
│   │   ├── CommunityUser.cs
│   │   ├── CommunityUserProfile.cs
│   │   ├── Block.cs
│   │   ├── Floor.cs
│   │   ├── Unit.cs
│   │   ├── UnitType.cs
│   │   ├── ParkingSlot.cs
│   │   ├── UnitOwnership.cs
│   │   ├── Lease.cs
│   │   ├── LeaseParty.cs
│   │   ├── Document.cs
│   │   ├── RoleGroup.cs
│   │   ├── RoleGroupPermission.cs
│   │   └── CommunityUserRoleGroup.cs
│   ├── Enums/
│   │   ├── PartyType.cs
│   │   ├── PartyAddressType.cs
│   │   ├── PartyContactType.cs
│   │   ├── DocumentOwnerType.cs
│   │   ├── DocumentCategory.cs
│   │   ├── UnitStatus.cs
│   │   ├── ParkingLocationType.cs
│   │   ├── ParkingStatus.cs
│   │   ├── LeaseStatus.cs
│   │   ├── LeasePartyRole.cs
│   │   ├── DirectoryVisibilityScope.cs
│   │   └── RoleGroupType.cs
│   └── Events/
│       ├── CommunityUserCreatedEvent.cs
│       └── LeaseActivatedEvent.cs
├── Amenities/
│   ├── Entities/
│   │   ├── Amenity.cs
│   │   └── AmenityBooking.cs
│   ├── Enums/
│   │   ├── AmenityType.cs
│   │   ├── AmenityStatus.cs
│   │   ├── AmenityBookingStatus.cs
│   │   ├── AmenityDepositStatus.cs
│   │   └── AmenityBookingSource.cs
│   └── Events/
│       ├── AmenityBookingCreatedEvent.cs
│       └── AmenityBookingApprovedEvent.cs
├── Maintenance/
│   ├── Entities/
│   │   ├── MaintenanceCategory.cs
│   │   ├── MaintenanceRequest.cs
│   │   ├── MaintenanceApproval.cs
│   │   └── MaintenanceComment.cs
│   ├── Enums/
│   │   ├── MaintenanceStatus.cs
│   │   ├── MaintenancePriority.cs
│   │   ├── MaintenanceSource.cs
│   │   ├── MaintenanceApprovalStatus.cs
│   │   ├── MaintenanceWorkLogType.cs
│   │   └── MaintenanceCommentType.cs
│   └── Events/
│       ├── MaintenanceRequestCreatedEvent.cs
│       ├── MaintenanceRequestAssignedEvent.cs
│       └── MaintenanceApprovalRequestedEvent.cs
├── Visitor/
│   ├── Entities/
│   │   └── VisitorPass.cs
│   ├── Enums/
│   │   ├── VisitorType.cs
│   │   ├── VisitorPassStatus.cs
│   │   └── VisitorSource.cs
│   └── Events/
│       ├── VisitorPassCreatedEvent.cs
│       ├── VisitorPassApprovedEvent.cs
│       └── VisitorCheckedInEvent.cs
├── Announcements/
│   ├── Entities/
│   │   ├── Announcement.cs
│   │   ├── AnnouncementAudience.cs
│   │   ├── AnnouncementLike.cs
│   │   ├── AnnouncementComment.cs
│   │   └── AnnouncementRead.cs
│   ├── Enums/
│   │   ├── AnnouncementStatus.cs
│   │   ├── AnnouncementCategory.cs
│   │   ├── AnnouncementPriority.cs
│   │   └── AnnouncementAudienceTargetType.cs
│   └── Events/
│       └── AnnouncementPublishedEvent.cs
└── Marketplace/
    ├── Entities/
    │   ├── MarketplaceCategory.cs
    │   ├── MarketplaceListing.cs
    │   ├── MarketplaceComment.cs
    │   ├── MarketplaceOffer.cs
    │   ├── MarketplaceListingLike.cs
    │   └── MarketplaceListingFavorite.cs
    ├── Enums/
    │   ├── MarketplaceListingStatus.cs
    │   ├── MarketplaceCondition.cs
    │   ├── MarketplaceListingType.cs
    │   └── MarketplaceSource.cs
    └── Events/
        ├── ListingCreatedEvent.cs
        └── ListingApprovedEvent.cs
```

### 2. **Savi.SharedKernel** (Cross-cutting Abstractions)

```
Savi.SharedKernel/
├── Interfaces/
│   ├── ICurrentUser.cs
│   ├── ITenantContext.cs
│   ├── IDateTimeProvider.cs
│   ├── IFileStorageService.cs
│   └── IBackgroundJobScheduler.cs
├── Authorization/
│   ├── PermissionDefinition.cs
│   └── Permissions.cs  # Static catalog
├── Results/
│   ├── Result.cs
│   ├── Result{T}.cs
│   └── PagedResult{T}.cs
├── Exceptions/
│   ├── NotFoundException.cs
│   ├── ForbiddenException.cs
│   ├── ValidationException.cs
│   └── ConflictException.cs
└── Extensions/
    ├── StringExtensions.cs
    └── GuidExtensions.cs
```

### 3. **Savi.MultiTenancy**

```
Savi.MultiTenancy/
├── Interfaces/
│   ├── ITenantContext.cs
│   ├── ITenantResolver.cs
│   ├── ITenantDbContextFactory.cs
│   └── ITenantStore.cs
├── Implementation/
│   ├── TenantContext.cs
│   ├── TenantResolver.cs
│   ├── TenantDbContextFactory.cs
│   └── TenantStore.cs
├── Middleware/
│   └── TenantContextMiddleware.cs
├── Attributes/
│   ├── RequireTenantAttribute.cs
│   └── PlatformOnlyAttribute.cs
└── Extensions/
    └── ServiceCollectionExtensions.cs
```

### 4. **Savi.Application** (Use Cases - CQRS)

```
Savi.Application/
├── Common/
│   ├── Behaviors/
│   │   ├── ValidationBehavior.cs
│   │   ├── LoggingBehavior.cs
│   │   └── PerformanceBehavior.cs
│   ├── Interfaces/
│   │   ├── IPlatformDbContext.cs
│   │   └── ITenantDbContext.cs
│   ├── Mappings/
│   │   └── IMapFrom{T}.cs
│   └── Models/
│       ├── PaginationQuery.cs
│       └── SortQuery.cs
├── Platform/
│   ├── Tenants/
│   │   ├── Commands/
│   │   │   ├── CreateTenant/
│   │   │   │   ├── CreateTenantCommand.cs
│   │   │   │   ├── CreateTenantCommandHandler.cs
│   │   │   │   └── CreateTenantValidator.cs
│   │   │   ├── UpdateTenant/
│   │   │   └── SuspendTenant/
│   │   ├── Queries/
│   │   │   ├── GetTenantById/
│   │   │   ├── ListTenants/
│   │   │   └── GetTenantStatistics/
│   │   └── Dtos/
│   │       ├── TenantDto.cs
│   │       ├── TenantDetailDto.cs
│   │       └── TenantMappingProfile.cs
│   ├── Users/
│   │   ├── Commands/
│   │   │   └── CreatePlatformUser/
│   │   ├── Queries/
│   │   │   └── GetUserById/
│   │   └── Dtos/
│   ├── Invitations/
│   │   ├── Commands/
│   │   │   ├── InviteCommunityAdmin/
│   │   │   └── AcceptInvitation/
│   │   └── Queries/
│   ├── Plans/
│   │   ├── Commands/
│   │   ├── Queries/
│   │   └── Dtos/
│   └── Permissions/
│       ├── Queries/
│       │   └── GetAllPermissions/
│       └── Dtos/
├── Tenant/
│   ├── Me/
│   │   ├── Queries/
│   │   │   ├── GetMyProfile/
│   │   │   ├── GetMyNavigation/
│   │   │   └── GetMyTenantInfo/
│   │   ├── Commands/
│   │   │   └── UpdateMyProfile/
│   │   └── Dtos/
│   ├── Community/
│   │   ├── Parties/
│   │   │   ├── Commands/
│   │   │   ├── Queries/
│   │   │   └── Dtos/
│   │   ├── CommunityUsers/
│   │   │   ├── Commands/
│   │   │   ├── Queries/
│   │   │   └── Dtos/
│   │   ├── Blocks/
│   │   ├── Units/
│   │   ├── Leases/
│   │   └── Ownership/
│   ├── Amenities/
│   │   ├── Commands/
│   │   │   ├── CreateAmenity/
│   │   │   ├── UpdateAmenity/
│   │   │   ├── CreateBooking/
│   │   │   ├── ApproveBooking/
│   │   │   └── CancelBooking/
│   │   ├── Queries/
│   │   │   ├── GetAmenityById/
│   │   │   ├── ListAmenities/
│   │   │   ├── GetBookingById/
│   │   │   ├── ListMyBookings/
│   │   │   └── GetAvailableSlots/
│   │   └── Dtos/
│   │       ├── AmenityDto.cs
│   │       ├── AmenityBookingDto.cs
│   │       └── AmenityMappingProfile.cs
│   ├── Maintenance/
│   │   ├── Commands/
│   │   │   ├── CreateMaintenanceRequest/
│   │   │   ├── AssignMaintenanceRequest/
│   │   │   ├── UpdateRequestStatus/
│   │   │   ├── RequestApproval/
│   │   │   ├── ApproveMaintenanceApproval/
│   │   │   └── AddComment/
│   │   ├── Queries/
│   │   │   ├── GetRequestById/
│   │   │   ├── ListMyRequests/
│   │   │   ├── ListAllRequests/
│   │   │   └── GetRequestStatistics/
│   │   └── Dtos/
│   ├── Visitor/
│   │   ├── Commands/
│   │   │   ├── CreateVisitorPass/
│   │   │   ├── ApproveVisitorPass/
│   │   │   ├── RejectVisitorPass/
│   │   │   ├── CheckInVisitor/
│   │   │   └── CheckOutVisitor/
│   │   ├── Queries/
│   │   │   ├── GetVisitorPassById/
│   │   │   ├── ListMyVisitorPasses/
│   │   │   ├── ListPendingApprovals/
│   │   │   └── SearchVisitors/
│   │   └── Dtos/
│   ├── Announcements/
│   │   ├── Commands/
│   │   │   ├── CreateAnnouncement/
│   │   │   ├── PublishAnnouncement/
│   │   │   ├── LikeAnnouncement/
│   │   │   ├── AddComment/
│   │   │   └── MarkAsRead/
│   │   ├── Queries/
│   │   │   ├── GetAnnouncementById/
│   │   │   ├── ListAnnouncements/
│   │   │   ├── GetMyUnreadCount/
│   │   │   └── GetAnnouncementFeed/
│   │   └── Dtos/
│   └── Marketplace/
│       ├── Commands/
│       │   ├── CreateListing/
│       │   ├── UpdateListing/
│       │   ├── CloseListing/
│       │   ├── ApproveListing/
│       │   ├── LikeListing/
│       │   ├── AddToFavorites/
│       │   ├── MakeOffer/
│       │   └── AddComment/
│       ├── Queries/
│       │   ├── GetListingById/
│       │   ├── ListListings/
│       │   ├── ListMyListings/
│       │   ├── ListFavorites/
│       │   └── SearchListings/
│       └── Dtos/
└── EventHandlers/
    ├── VisitorPassCreatedEventHandler.cs
    ├── MaintenanceRequestCreatedEventHandler.cs
    └── AnnouncementPublishedEventHandler.cs
```

### 5. **Savi.Infrastructure**

```
Savi.Infrastructure/
├── Persistence/
│   ├── PlatformDbContext.cs
│   ├── TenantDbContext.cs
│   ├── Configurations/
│   │   ├── Platform/
│   │   │   ├── TenantConfiguration.cs
│   │   │   ├── PlatformUserConfiguration.cs
│   │   │   ├── PermissionConfiguration.cs
│   │   │   └── ...
│   │   └── Tenant/
│   │       ├── CommunityUserConfiguration.cs
│   │       ├── PartyConfiguration.cs
│   │       ├── UnitConfiguration.cs
│   │       ├── AmenityConfiguration.cs
│   │       ├── MaintenanceRequestConfiguration.cs
│   │       └── ...
│   ├── Migrations/
│   │   ├── Platform/
│   │   └── Tenant/
│   ├── Interceptors/
│   │   ├── AuditableEntityInterceptor.cs
│   │   └── SoftDeleteInterceptor.cs
│   └── Seeding/
│       ├── PlatformDataSeeder.cs
│       └── TenantDataSeeder.cs
├── Identity/
│   ├── FirebaseAuthService.cs
│   ├── CurrentUserService.cs
│   └── Models/
│       └── FirebaseTokenValidationResult.cs
├── Files/
│   ├── AzureBlobStorageService.cs
│   └── Models/
│       ├── FileUploadResult.cs
│       └── FileMetadata.cs
├── BackgroundJobs/
│   ├── HangfireBackgroundJobScheduler.cs
│   └── Jobs/
│       ├── TenantMigrationJob.cs
│       ├── MarketplaceExpirationJob.cs
│       └── VisitorPassCleanupJob.cs
├── Caching/
│   ├── TenantCacheService.cs
│   └── CacheKeyGenerator.cs
├── MultiTenancy/
│   └── EfTenantStore.cs
└── Extensions/
    └── ServiceCollectionExtensions.cs
```

### 6. **Savi.Api**

```
Savi.Api/
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── Configuration/
│   ├── DependencyInjection.cs
│   ├── SwaggerConfiguration.cs
│   ├── AuthenticationConfiguration.cs
│   ├── AuthorizationConfiguration.cs
│   ├── RateLimitingConfiguration.cs
│   └── CorsConfiguration.cs
├── Controllers/
│   ├── Platform/
│   │   ├── V1/
│   │   │   ├── TenantsController.cs
│   │   │   ├── UsersController.cs
│   │   │   ├── InvitationsController.cs
│   │   │   ├── PermissionsController.cs
│   │   │   └── PlansController.cs
│   ├── Tenant/
│   │   └── V1/
│   │       ├── MeController.cs
│   │       ├── PartiesController.cs
│   │       ├── CommunityUsersController.cs
│   │       ├── BlocksController.cs
│   │       ├── UnitsController.cs
│   │       ├── AmenitiesController.cs
│   │       ├── AmenityBookingsController.cs
│   │       ├── MaintenanceRequestsController.cs
│   │       ├── VisitorsController.cs
│   │       ├── AnnouncementsController.cs
│   │       └── MarketplaceController.cs
├── Middleware/
│   ├── ExceptionHandlingMiddleware.cs
│   ├── CorrelationIdMiddleware.cs
│   └── RequestLoggingMiddleware.cs
├── Filters/
│   ├── ValidateModelStateFilter.cs
│   └── ApiExceptionFilter.cs
├── Authorization/
│   ├── HasPermissionAttribute.cs
│   ├── PermissionRequirement.cs
│   └── PermissionRequirementHandler.cs
├── Models/
│   ├── ApiResponse{T}.cs
│   ├── ErrorResponse.cs
│   └── ValidationErrorResponse.cs
└── Extensions/
    └── HttpContextExtensions.cs
```

### 7. **Savi.BackgroundJobs**

```
Savi.BackgroundJobs/
├── Program.cs
├── appsettings.json
├── Jobs/
│   ├── Platform/
│   │   ├── TenantMigrationJob.cs
│   │   └── PlatformAuditCleanupJob.cs
│   └── Tenant/
│       ├── MarketplaceListingExpirationJob.cs
│       ├── VisitorPassExpirationJob.cs
│       ├── AmenityBookingReminderJob.cs
│       └── MaintenanceRequestEscalationJob.cs
├── Configuration/
│   └── HangfireConfiguration.cs
└── Extensions/
    └── ServiceCollectionExtensions.cs
```

### 8. **Test Projects**

```
Savi.UnitTests/
├── Application/
│   ├── Amenities/
│   ├── Maintenance/
│   ├── Visitor/
│   └── Marketplace/
├── Domain/
│   └── Entities/
└── Infrastructure/
    └── Services/

Savi.IntegrationTests/
├── Api/
│   ├── Platform/
│   └── Tenant/
├── Infrastructure/
│   └── Persistence/
└── Fixtures/
    ├── TestWebApplicationFactory.cs
    └── DatabaseFixture.cs

Savi.ArchitectureTests/
├── DependencyTests.cs
├── NamingConventionTests.cs
└── LayerTests.cs
```

## Key Points About This Structure

1. **Follows Clean Architecture**: Clear separation of concerns with dependencies pointing inward
2. **CQRS Pattern**: Commands and Queries clearly separated in Application layer
3. **Feature-based Organization**: Application layer organized by feature/module, not technical layers
4. **Multi-tenant Ready**: Dedicated project for multi-tenancy concerns
5. **Testable**: Separate test projects for unit, integration, and architecture tests
6. **Scalable**: Modular structure allows for easy extraction to microservices if needed
7. **DBML-Aligned**: Domain entities directly reflect your DBML schema
8. **Permission-Centric**: Authorization and permissions are first-class concerns

This structure supports your entire scope including Platform management, Community setup, Amenities, Maintenance, Visitors, Announcements, and Marketplace modules while maintaining architectural consistency.