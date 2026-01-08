# SAVI Multi-Agent Development Rules & Guidelines

## 0. Meta Rules - Read This First

### Rule 0.1: Stop Before Inventing
**If something you want to do isn't explicitly covered in these rules: STOP and ASK.**
- Do not improvise solutions
- Do not create new patterns
- Do not "just try something"
- Ask the lead/architect first

### Rule 0.2: DBML is Law
**All schema changes MUST go through DBML first.**
1. Propose the change in DBML format
2. Wait for approval
3. Then and only then update EF Core entities and configurations
4. Never modify database schema without DBML approval

### Rule 0.3: Read Before Write
**Before implementing ANY feature:**
1. Read the relevant DBML schema (`tenant-db.txt` or `platform-db.txt`)
2. Read `architecture-guideline.md` sections relevant to your work
3. Check if similar features already exist in the codebase
4. Understand the complete flow before writing code

---

## 1. Project Boundaries & Dependencies

### Rule 1.1: Respect Project Dependencies
**NEVER violate these dependency rules:**

```
✅ ALLOWED:
Savi.Api → Savi.Application, Savi.Infrastructure, Savi.SharedKernel, Savi.MultiTenancy
Savi.Application → Savi.Domain, Savi.SharedKernel, Savi.MultiTenancy
Savi.Infrastructure → Savi.Application, Savi.Domain, Savi.SharedKernel, Savi.MultiTenancy
Savi.MultiTenancy → Savi.SharedKernel
Savi.BackgroundJobs → Savi.Application, Savi.Infrastructure, Savi.SharedKernel, Savi.MultiTenancy
Savi.Domain → NOTHING (pure domain)

❌ FORBIDDEN:
- Any project → Savi.Api
- Savi.Domain → any project
- Circular references of any kind
```

**Important Note:** Infrastructure → Application is **allowed and required** so that Infrastructure can implement interfaces defined in Application.Common.Interfaces (particularly DbContext interfaces, as specified in Rule 3.1). This is NOT a circular dependency because Application does not reference Infrastructure.

**Before adding a reference:** Stop and ask if you're unsure.

### Rule 1.2: No New Projects Without Approval
The project structure is FIXED:
- Savi.Api
- Savi.Application
- Savi.Domain
- Savi.Infrastructure
- Savi.MultiTenancy
- Savi.SharedKernel
- Savi.BackgroundJobs

**Do not create new projects.** If you think you need one, ask first.

---

## 2. Domain Layer Rules (Savi.Domain)

### Rule 2.1: Domain is Pure
**Savi.Domain MUST NOT reference:**
- Entity Framework (no `DbContext`, no `DbSet`)
- ASP.NET Core (no `HttpContext`, no `IActionResult`)
- MediatR directly (domain events are POCOs)
- Any infrastructure concern

**Savi.Domain MAY contain:**
- Entities (inheriting from `BaseEntity`)
- Value Objects
- Enums
- Domain Events (as POCOs)
- Domain Exceptions
- Interfaces for domain services (if needed)

### Rule 2.2: Base Entity Convention
**ALL entities MUST inherit from `BaseEntity` and include these fields EXACTLY as named in DBML:**

```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
```

⚠️ **CRITICAL**: Field names are UNIFORM across all entities:
- All entities (both TenantDB and PlatformDB) use: `CreatedBy`, `UpdatedBy`
- Use `DateTime` (not `DateTimeOffset`) for timestamp fields

### Rule 2.3: Organize by Module
**Follow this exact structure in Savi.Domain:**

```
Savi.Domain/
├── Common/          # BaseEntity, interfaces shared across modules
├── Platform/        # PlatformDB entities
│   ├── Entities/
│   ├── Enums/
│   └── Events/
├── Tenant/          # Core tenant entities (Party, Unit, etc.)
├── Amenities/       # Amenity module entities
├── Maintenance/     # Maspintenance module entities
├── Visitor/         # Visitor module entities
├── Announcements/   # Announcements module entities
└── Marketplace/     # Marketplace module entities
```

**If you're creating a new entity:** Place it in the correct module folder.

### Rule 2.4: Enums Must Match DBML
**All enums MUST:**
- Match the DBML enum definition exactly
- Be placed in the `Enums/` folder of their module
- Use PascalCase for enum values (even if DBML shows differently)

Example:
```csharp
// DBML shows: Enum MaintenanceStatus { New, Assigned, InProgress }
// Code must be:
public enum MaintenanceStatus
{
    New,
    Assigned,
    InProgress,
    WaitingForResident,
    Completed,
    Rejected,
    Cancelled
}
```

---

## 3. SharedKernel Rules (Savi.SharedKernel)

### Rule 3.1: SharedKernel Contents
**ONLY place these in SharedKernel:**
- Cross-cutting interfaces (`ICurrentUser`, `ITenantContext`, `IDateTimeProvider`, `IFileStorageService`)
- Common result types (`Result<T>`, `PagedResult<T>`)
- Common exceptions (`NotFoundException`, `ForbiddenException`, `ValidationException`)
- The `Permissions` static catalog
- Simple extension methods used across multiple projects

**DO NOT place in SharedKernel:**
- Business logic
- Entity definitions
- DbContext interfaces (those go in Application)
- Anything specific to one module

### Rule 3.2: Permissions Catalog is Sacred
**The `Permissions` static class is the SINGLE SOURCE OF TRUTH for all permissions.**

```csharp
public static class Permissions
{
    public static class Platform
    {
        public const string TenantView = "PLATFORM_TENANT_VIEW";
        public const string TenantManage = "PLATFORM_TENANT_MANAGE";
        // ...
    }
    
    public static class Tenant
    {
        public static class Maintenance
        {
            public const string RequestView = "TENANT_MAINTENANCE_REQUEST_VIEW";
            public const string RequestCreate = "TENANT_MAINTENANCE_REQUEST_CREATE";
            // ...
        }
        // ... other modules
    }
}
```

**Rules:**
- Never use magic strings for permissions
- Always reference `Permissions.*` constants
- New permissions must be added to this catalog FIRST, then seeded to PlatformDB
- Permission keys must follow pattern: `{SCOPE}_{MODULE}_{ENTITY}_{ACTION}`

---

## 4. Application Layer Rules (Savi.Application)

### Rule 4.1: CQRS Structure is Mandatory
**Every use case MUST follow this structure:**

```
Savi.Application/
├── {Platform|Tenant}/
    ├── {Module}/              # e.g., Maintenance
        ├── Commands/
        │   ├── {UseCaseName}/       # e.g., CreateMaintenanceRequest
        │   │   ├── {UseCaseName}Command.cs
        │   │   ├── {UseCaseName}CommandHandler.cs
        │   │   └── {UseCaseName}Validator.cs
        ├── Queries/
        │   ├── {UseCaseName}/       # e.g., GetMaintenanceRequestById
        │   │   ├── {UseCaseName}Query.cs
        │   │   ├── {UseCaseName}QueryHandler.cs
        │   │   └── {UseCaseName}Validator.cs (if needed)
        └── Dtos/
            ├── {Entity}Dto.cs
            └── {Module}MappingProfile.cs
```

### Rule 4.2: Command/Query Naming
**Follow these exact naming conventions:**

```csharp
// Commands (write operations)
public record CreateMaintenanceRequestCommand : IRequest<Result<Guid>>;
public class CreateMaintenanceRequestCommandHandler : IRequestHandler<CreateMaintenanceRequestCommand, Result<Guid>>;
public class CreateMaintenanceRequestValidator : AbstractValidator<CreateMaintenanceRequestCommand>;

// Queries (read operations)
public record GetMaintenanceRequestByIdQuery(Guid Id) : IRequest<Result<MaintenanceRequestDto>>;
public class GetMaintenanceRequestByIdQueryHandler : IRequestHandler<GetMaintenanceRequestByIdQuery, Result<MaintenanceRequestDto>>;
```

**Key rules:**
- Commands end with `Command`
- Queries end with `Query`
- Handlers end with `Handler`
- Validators end with `Validator`
- Use `record` for commands/queries (immutable)
- Use `class` for handlers/validators

### Rule 4.3: Always Use ICurrentUser and ITenantContext
**NEVER access user/tenant info directly.**

```csharp
// ❌ WRONG - Never do this
var userId = httpContext.User.FindFirst("sub").Value;
var tenantId = httpContext.Request.Headers["X-Tenant-Id"];

// ✅ CORRECT - Always use abstractions
public class CreateMaintenanceRequestCommandHandler
{
    private readonly ICurrentUser _currentUser;
    private readonly ITenantContext _tenantContext;
    
    public async Task<Result<Guid>> Handle(...)
    {
        var userId = _currentUser.UserId;
        var tenantId = _tenantContext.TenantId;
        // ...
    }
}
```

### Rule 4.4: Handlers Must Be Thin
**Business logic lives in Domain entities, handlers orchestrate.**

```csharp
// ❌ WRONG - Business logic in handler
public async Task<Result<Guid>> Handle(...)
{
    if (command.StartDate < DateTime.Now)
        return Result<Guid>.Failure("Start date cannot be in the past");
    
    if (command.MonthlyRent <= 0)
        return Result<Guid>.Failure("Rent must be positive");
    
    // ... more business rules
}

// ✅ CORRECT - Domain entity contains business logic
public async Task<Result<Guid>> Handle(...)
{
    var lease = Lease.Create(
        command.UnitId,
        command.StartDate,
        command.MonthlyRent,
        _currentUser.UserId
    ); // Domain entity validates internally
    
    if (lease.IsFailure)
        return Result<Guid>.Failure(lease.Error);
    
    await _dbContext.Leases.AddAsync(lease.Value);
    await _dbContext.SaveChangesAsync();
    
    return Result<Guid>.Success(lease.Value.Id);
}
```

### Rule 4.5: Query Handlers Must Use AsNoTracking()
**ALL read-only queries MUST use `.AsNoTracking()`:**

```csharp
// ✅ CORRECT
var request = await _dbContext.MaintenanceRequests
    .AsNoTracking()
    .Where(x => x.Id == query.Id)
    .FirstOrDefaultAsync(cancellationToken);

// ❌ WRONG - Missing AsNoTracking()
var request = await _dbContext.MaintenanceRequests
    .Where(x => x.Id == query.Id)
    .FirstOrDefaultAsync(cancellationToken);
```

### Rule 4.6: Always Validate Commands
**Every command that accepts external input MUST have a FluentValidation validator:**

```csharp
public class CreateMaintenanceRequestValidator : AbstractValidator<CreateMaintenanceRequestCommand>
{
    public CreateMaintenanceRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);
            
        RuleFor(x => x.CategoryId)
            .NotEmpty();
            
        RuleFor(x => x.Priority)
            .IsInEnum();
    }
}
```

### Rule 4.7: Pagination is Mandatory
**ALL list queries MUST return `PagedResult<T>` and accept pagination parameters:**

```csharp
// ✅ CORRECT
public record ListMaintenanceRequestsQuery(
    int Page = 1,
    int PageSize = 20,
    MaintenanceStatus? Status = null
) : IRequest<Result<PagedResult<MaintenanceRequestDto>>>;

// ❌ WRONG - Returning unbounded list
public record ListMaintenanceRequestsQuery() 
    : IRequest<Result<List<MaintenanceRequestDto>>>;
```

---

## 5. Infrastructure Layer Rules (Savi.Infrastructure)

### Rule 5.1: DbContext Organization
**Two DbContexts, organized strictly:**

```
Savi.Infrastructure/Persistence/
├── PlatformDbContext.cs        # For PlatformDB
├── TenantDbContext.cs          # For TenantDB
├── Configurations/
│   ├── Platform/               # EntityTypeConfigurations for Platform entities
│   │   ├── TenantConfiguration.cs
│   │   ├── PlatformUserConfiguration.cs
│   │   └── ...
│   └── Tenant/                 # EntityTypeConfigurations for Tenant entities
│       ├── PartyConfiguration.cs
│       ├── UnitConfiguration.cs
│       └── ...
└── Migrations/
    ├── Platform/               # Migrations for PlatformDB
    └── Tenant/                 # Migrations for TenantDB
```

### Rule 5.2: Entity Configuration is Mandatory
**Every entity MUST have an `IEntityTypeConfiguration<T>`:**

```csharp
public class MaintenanceRequestConfiguration : IEntityTypeConfiguration<MaintenanceRequest>
{
    public void Configure(EntityTypeBuilder<MaintenanceRequest> builder)
    {
        builder.ToTable("MaintenanceRequest");
        
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>(); // Store enums as strings
            
        // Foreign keys
        builder.HasOne<Unit>()
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Indexes
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAt);
    }
}
```

**Rules:**
- Use `.ToTable()` with exact DBML table name
- Configure all string lengths with `.HasMaxLength()`
- Store enums as strings: `.HasConversion<string>()`
- Explicitly configure foreign keys
- Add indexes for commonly queried fields

### Rule 5.3: Migration Naming
**Follow this exact pattern:**

```bash
# Platform migrations
dotnet ef migrations add AddPermissionTable --context PlatformDbContext --output-dir Persistence/Migrations/Platform

# Tenant migrations
dotnet ef migrations add AddMaintenanceRequest --context TenantDbContext --output-dir Persistence/Migrations/Tenant
```

**Migration names must be:**
- Descriptive of the change
- PascalCase
- Start with a verb (Add, Update, Remove, Create, Modify)

### Rule 5.4: Service Implementations
**Implementation classes go in Infrastructure, interfaces in SharedKernel:**

```
Savi.SharedKernel/Interfaces/
    IFileStorageService.cs
    
Savi.Infrastructure/Files/
    AzureBlobStorageService.cs (implements IFileStorageService)
```

---

## 6. API Layer Rules (Savi.Api)

### Rule 6.1: Controllers Are Thin
**Controllers ONLY:**
1. Accept HTTP requests
2. Validate route/query parameters
3. Map to commands/queries
4. Call `_mediator.Send()`
5. Return DTOs

**Controllers MUST NOT:**
- Contain business logic
- Access DbContext directly
- Perform authorization checks (use `[HasPermission]` instead)
- Construct domain entities

### Rule 6.2: Controller Organization
```
Savi.Api/Controllers/
├── Platform/
│   └── V1/
│       ├── TenantsController.cs
│       ├── UsersController.cs
│       └── ...
└── Tenant/
    └── V1/
        ├── MeController.cs
        ├── AmenitiesController.cs
        ├── MaintenanceRequestsController.cs
        └── ...
```

### Rule 6.3: Controller Template
**Follow this exact pattern:**

```csharp
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/maintenance/requests")]
[Produces("application/json")]
public class MaintenanceRequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public MaintenanceRequestsController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(MaintenanceRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var query = new GetMaintenanceRequestByIdQuery(id);
        var result = await _mediator.Send(query);
        
        return result.IsSuccess 
            ? Ok(result.Value) 
            : NotFound(result.Error);
    }
    
    [HttpPost]
    [HasPermission(Permissions.Tenant.Maintenance.RequestCreate)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMaintenanceRequestCommand command)
    {
        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return BadRequest(result.Error);
            
        return CreatedAtAction(
            nameof(GetById), 
            new { id = result.Value }, 
            result.Value);
    }
    
    [HttpGet]
    [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
    [ProducesResponseType(typeof(PagedResult<MaintenanceRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] ListMaintenanceRequestsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result.Value);
    }
}
```

### Rule 6.4: Route Conventions
**MUST follow these patterns:**

```
Platform endpoints:
  /api/v1/platform/tenants
  /api/v1/platform/users
  /api/v1/platform/permissions

Tenant endpoints:
  /api/v1/tenant/me
  /api/v1/tenant/me/profile
  /api/v1/tenant/me/navigation
  /api/v1/tenant/maintenance/requests
  /api/v1/tenant/amenities
  /api/v1/tenant/visitors
  /api/v1/tenant/announcements
  /api/v1/tenant/marketplace/listings
```

### Rule 6.5: Always Use [HasPermission]
**NEVER use raw `[Authorize]` or magic strings:**

```csharp
// ❌ WRONG
[Authorize(Policy = "TENANT_MAINTENANCE_REQUEST_CREATE")]

// ✅ CORRECT
[HasPermission(Permissions.Tenant.Maintenance.RequestCreate)]
```

---

## 7. Multi-Tenancy Rules (Savi.MultiTenancy)

### Rule 7.1: Never Access Tenant Info Directly
**Always use ITenantContext:**

```csharp
// ❌ WRONG
var tenantId = httpContext.Request.Headers["X-Tenant-Id"];

// ✅ CORRECT
public class MyHandler
{
    private readonly ITenantContext _tenantContext;
    
    public async Task Handle(...)
    {
        var tenantId = _tenantContext.TenantId;
        if (tenantId == null)
            return Result.Failure("Tenant context not set");
        // ...
    }
}
```

### Rule 7.2: Tenant DbContext Factory
**For background jobs or multi-tenant operations, use ITenantDbContextFactory:**

```csharp
public class SomeBackgroundJob
{
    private readonly ITenantDbContextFactory _dbFactory;
    
    public async Task Execute(Guid tenantId)
    {
        await using var dbContext = await _dbFactory.CreateDbContextAsync(tenantId);
        
        // Work with tenant-specific data
        var units = await dbContext.Units.ToListAsync();
    }
}
```

---

## 8. Authorization & Permissions Rules

### Rule 8.1: Permission Hierarchy
**Permissions follow strict hierarchy:**

```
PLATFORM permissions:
  - PLATFORM_TENANT_VIEW
  - PLATFORM_TENANT_MANAGE
  - PLATFORM_USER_MANAGE
  - ...

TENANT permissions:
  - TENANT_MAINTENANCE_REQUEST_VIEW
  - TENANT_MAINTENANCE_REQUEST_CREATE
  - TENANT_MAINTENANCE_REQUEST_ASSIGN
  - TENANT_MAINTENANCE_REQUEST_APPROVECOST
  - TENANT_AMENITY_BOOKING_VIEW
  - TENANT_AMENITY_BOOKING_CREATE
  - TENANT_AMENITY_BOOKING_APPROVE
  - ...
```

### Rule 8.2: Adding New Permissions
**Follow these steps in exact order:**

1. **Add to Permissions static class:**
```csharp
public static class Permissions
{
    public static class Tenant
    {
        public static class Visitor
        {
            public const string PassView = "TENANT_VISITOR_PASS_VIEW";
            public const string PassCreate = "TENANT_VISITOR_PASS_CREATE";
            public const string PassApprove = "TENANT_VISITOR_PASS_APPROVE";
        }
    }
}
```

2. **Add to PermissionDefinition.All():**
```csharp
public static IEnumerable<PermissionDefinition> All()
{
    yield return new PermissionDefinition(
        Permissions.Tenant.Visitor.PassView,
        "Tenant",
        "Visitor",
        "PassView",
        "View visitor passes"
    );
    // ...
}
```

3. **Create migration to seed to PlatformDB.Permission table**

4. **Assign to appropriate RoleGroups via RoleGroupPermission**

---

## 9. Background Jobs Rules (Savi.BackgroundJobs)

### Rule 9.1: TenantId is Always First Parameter
**For any tenant-scoped job:**

```csharp
// ✅ CORRECT
public class MarketplaceExpirationJob
{
    public async Task Execute(Guid tenantId, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbFactory.CreateDbContextAsync(tenantId);
        
        var expiredListings = await dbContext.MarketplaceListings
            .Where(x => x.ExpiresAt <= DateTime.UtcNow && x.Status == MarketplaceListingStatus.Approved)
            .ToListAsync(cancellationToken);
            
        foreach (var listing in expiredListings)
        {
            listing.Status = MarketplaceListingStatus.Expired;
        }
        
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

// Enqueuing:
BackgroundJob.Enqueue<MarketplaceExpirationJob>(job => 
    job.Execute(tenantId, CancellationToken.None));
```

### Rule 9.2: Job Organization
```
Savi.BackgroundJobs/Jobs/
├── Platform/
│   ├── TenantMigrationJob.cs
│   └── PlatformAuditCleanupJob.cs
└── Tenant/
    ├── MarketplaceListingExpirationJob.cs
    ├── VisitorPassExpirationJob.cs
    └── MaintenanceRequestEscalationJob.cs
```

---

## 10. Logging & Error Handling Rules

### Rule 10.1: Structured Logging Only
**Use structured logging with properties:**

```csharp
// ✅ CORRECT
_logger.LogInformation(
    "Maintenance request {RequestId} created for Unit {UnitId} by User {UserId}",
    entity.Id,
    entity.UnitId,
    _currentUser.UserId
);

// ❌ WRONG
_logger.LogInformation($"Maintenance request {entity.Id} created for Unit {entity.UnitId}");
```

### Rule 10.2: Exception Handling
**Let middleware handle exceptions, don't wrap everything in try-catch:**

```csharp
// ✅ CORRECT - Let exception propagate to middleware
public async Task<Result<Guid>> Handle(...)
{
    var entity = await _dbContext.MaintenanceRequests.FindAsync(command.Id);
    
    if (entity == null)
        return Result<Guid>.Failure("Maintenance request not found");
    
    entity.UpdateStatus(command.Status);
    await _dbContext.SaveChangesAsync();
    
    return Result<Guid>.Success(entity.Id);
}

// ❌ WRONG - Unnecessary try-catch
public async Task<Result<Guid>> Handle(...)
{
    try
    {
        var entity = await _dbContext.MaintenanceRequests.FindAsync(command.Id);
        // ...
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error handling request");
        return Result<Guid>.Failure("An error occurred");
    }
}
```

---

## 11. Testing Rules

### Rule 11.1: Test Project Organization
```
Savi.UnitTests/
├── Application/
│   └── Maintenance/
│       └── CreateMaintenanceRequestCommandHandlerTests.cs
├── Domain/
│   └── Entities/
│       └── MaintenanceRequestTests.cs
└── Infrastructure/

Savi.IntegrationTests/
├── Api/
│   └── Tenant/
│       └── MaintenanceRequestsControllerTests.cs
```

### Rule 11.2: Unit Test Naming
```csharp
public class CreateMaintenanceRequestCommandHandlerTests
{
    [Fact]
    public async Task Handle_ValidRequest_ShouldCreateMaintenanceRequest()
    {
        // Arrange
        // Act
        // Assert
    }
    
    [Fact]
    public async Task Handle_InvalidCategoryId_ShouldReturnFailure()
    {
        // Arrange
        // Act
        // Assert
    }
}
```

**Pattern:** `MethodName_Scenario_ExpectedResult`

---

## 12. Code Review Checklist

Before submitting code, verify:

### ✅ Structure
- [ ] Files are in correct project and folder
- [ ] Naming conventions followed (Command, Query, Handler, Validator, Dto, etc.)
- [ ] No new projects created without approval
- [ ] Dependencies respect the allowed direction

### ✅ Domain
- [ ] Entities inherit from BaseEntity
- [ ] Field names match DBML exactly
- [ ] Enums match DBML
- [ ] No EF, HTTP, or infrastructure concerns in Domain

### ✅ Application
- [ ] CQRS pattern followed (Command/Query separation)
- [ ] ICurrentUser and ITenantContext used (never direct access)
- [ ] Queries use AsNoTracking()
- [ ] All list queries return PagedResult<T>
- [ ] Commands have validators
- [ ] Handlers are thin (orchestration only)

### ✅ Infrastructure
- [ ] Entity configurations exist for all entities
- [ ] Enums stored as strings
- [ ] Migrations named correctly and in right folder
- [ ] Service implementations in correct folders

### ✅ API
- [ ] Controllers are thin (no business logic)
- [ ] Routes follow conventions
- [ ] [HasPermission] used with Permissions.* constants
- [ ] ProducesResponseType attributes present
- [ ] Version annotation present

### ✅ Permissions
- [ ] New permissions added to Permissions static class first
- [ ] Permission keys follow naming pattern
- [ ] No magic strings anywhere

### ✅ Multi-tenancy
- [ ] ITenantContext used for tenant info
- [ ] Background jobs have tenantId as first parameter
- [ ] No direct header access

### ✅ DBML
- [ ] Schema matches DBML
- [ ] Any changes proposed in DBML first
- [ ] Approved before implementation

---

## 13. Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Business Logic in Controllers
```csharp
// NEVER DO THIS
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateRequest request)
{
    if (request.StartDate < DateTime.Now)
        return BadRequest("Start date must be in future");
    
    var entity = new Lease { /* ... */ };
    _dbContext.Leases.Add(entity);
    await _dbContext.SaveChangesAsync();
    
    return Ok(entity.Id);
}
```

### ❌ Anti-Pattern 2: Direct DbContext in Controllers
```csharp
// NEVER DO THIS
public class MaintenanceRequestsController : ControllerBase
{
    private readonly TenantDbContext _dbContext; // ❌ NO!
}
```

### ❌ Anti-Pattern 3: Magic Strings for Permissions
```csharp
// NEVER DO THIS
[Authorize(Policy = "TENANT_MAINTENANCE_REQUEST_CREATE")]
```

### ❌ Anti-Pattern 4: Missing AsNoTracking()
```csharp
// NEVER DO THIS in queries
var requests = await _dbContext.MaintenanceRequests
    .Where(x => x.Status == MaintenanceStatus.New)
    .ToListAsync();
```

### ❌ Anti-Pattern 5: Unbounded Lists
```csharp
// NEVER DO THIS
[HttpGet]
public async Task<IActionResult> GetAll()
{
    var all = await _dbContext.MaintenanceRequests.ToListAsync();
    return Ok(all); // Could return millions of records!
}
```

### ❌ Anti-Pattern 6: Creating New Patterns
```csharp
// NEVER DO THIS - Don't invent new patterns
public class MaintenanceService // ❌ What is this? Not Command/Query!
{
    public void DoSomething() { }
}
```

---

## 14. When Multiple Agents Work Together

### Rule 14.1: Claim Your Work
**Before starting work:**
1. Announce what you're implementing (e.g., "Implementing CreateVisitorPass command")
2. List the files you'll be creating/modifying
3. Wait for acknowledgment to avoid conflicts

### Rule 14.2: Coordinate on Shared Files
**These files are HIGH CONFLICT RISK:**
- `Permissions.cs` (in SharedKernel)
- DbContext classes
- Base entity classes
- Migration files

**Protocol:**
1. If you need to modify these, announce it
2. Only one agent modifies at a time
3. Commit and push immediately after changes

### Rule 14.3: Module Boundaries
**Agents should work on different modules when possible:**
- Agent A: Maintenance module
- Agent B: Visitor module
- Agent C: Marketplace module

This minimizes conflicts.

### Rule 14.4: Pull Before Push
**Always:**
1. Pull latest changes
2. Verify your code still compiles
3. Run any existing tests
4. Then push

---

## 15. Quick Reference: "Where Does X Go?"

| What | Where | Example |
|------|-------|---------|
| Entity class | `Savi.Domain/{Module}/Entities/` | `MaintenanceRequest.cs` |
| Enum | `Savi.Domain/{Module}/Enums/` | `MaintenanceStatus.cs` |
| Domain event | `Savi.Domain/{Module}/Events/` | `MaintenanceRequestCreatedEvent.cs` |
| Command | `Savi.Application/{Platform\|Tenant}/{Module}/Commands/{UseCase}/` | `CreateMaintenanceRequestCommand.cs` |
| Query | `Savi.Application/{Platform\|Tenant}/{Module}/Queries/{UseCase}/` | `GetMaintenanceRequestByIdQuery.cs` |
| Validator | Same folder as command/query | `CreateMaintenanceRequestValidator.cs` |
| DTO | `Savi.Application/{Platform\|Tenant}/{Module}/Dtos/` | `MaintenanceRequestDto.cs` |
| Controller | `Savi.Api/Controllers/{Platform\|Tenant}/V1/` | `MaintenanceRequestsController.cs` |
| Entity configuration | `Savi.Infrastructure/Persistence/Configurations/{Platform\|Tenant}/` | `MaintenanceRequestConfiguration.cs` |
| Service interface | `Savi.SharedKernel/Interfaces/` | `IFileStorageService.cs` |
| Service implementation | `Savi.Infrastructure/{Category}/` | `AzureBlobStorageService.cs` |
| Background job | `Savi.BackgroundJobs/Jobs/{Platform\|Tenant}/` | `MaintenanceRequestEscalationJob.cs` |
| Permission constant | `Savi.SharedKernel/Authorization/Permissions.cs` | `Permissions.Tenant.Maintenance.RequestCreate` |

---

## 16. Emergency Contacts

**If you're stuck or unsure:**
1. Stop immediately
2. Document what you tried
3. Ask the lead/architect with:
   - What you're trying to do
   - What you've considered
   - Why you're unsure
4. Wait for guidance

**Never:**
- Improvise a solution
- "Try something and see if it works"
- Skip documentation
- Ignore these rules because of time pressure

---

## Summary: The Golden Rules

1. **DBML First** - All schema changes go through DBML
2. **No Improvisation** - If it's not in the rules, ask first
3. **Respect Dependencies** - Never violate project reference rules
4. **CQRS Always** - Commands and Queries, no exceptions
5. **Permissions from Catalog** - No magic strings
6. **Use Abstractions** - ICurrentUser and ITenantContext, never direct access
7. **AsNoTracking for Reads** - All queries must use it
8. **Paginate Everything** - No unbounded lists
9. **Controllers Are Thin** - Orchestration only, no business logic
10. **When in Doubt, Ask** - Don't guess, don't improvise

---

**These rules exist to ensure consistency, maintainability, and successful collaboration. Following them is not optional.**