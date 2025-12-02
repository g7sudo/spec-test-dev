# SAVI Backend Validation Report
**Generated:** $(date)  
**Rules Document:** `docs/development-rules-guidelines.md`

## Executive Summary

✅ **Overall Compliance:** Good, with **3 critical violations** and **2 warnings** identified.

---

## ✅ PASSING VALIDATIONS

### 1. Project Structure (Rule 1.2)
- ✅ All required projects exist: Api, Application, Domain, Infrastructure, MultiTenancy, SharedKernel, BackgroundJobs
- ✅ No unauthorized projects created

### 2. Domain Layer Purity (Rule 2.1)
- ✅ No `DbContext` or `DbSet` references in Domain
- ✅ No `HttpContext` or `IActionResult` references in Domain
- ✅ Domain entities inherit from `BaseEntity` correctly

### 3. BaseEntity Convention (Rule 2.2)
- ✅ BaseEntity has all required fields: `Id`, `Version`, `IsActive`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`
- ✅ Field names match DBML convention (`CreatedBy`, `UpdatedBy`)
- ✅ Uses `DateTime` (not `DateTimeOffset`)

### 4. CQRS Structure (Rule 4.1)
- ✅ Commands organized in `Commands/{UseCaseName}/` folders
- ✅ Queries organized in `Queries/{UseCaseName}/` folders
- ✅ DTOs in `Dtos/` folders
- ✅ Naming conventions followed (Command, Query, Handler, Validator)

### 5. Command Validators (Rule 4.6)
- ✅ All commands have validators:
  - `CreateTenantValidator.cs` ✅
  - `AcceptInvitationValidator.cs` ✅
  - `InviteTenantAdminValidator.cs` ✅

### 6. Controllers (Rule 6.1, 6.3)
- ✅ Controllers are thin - use MediatR only
- ✅ No direct DbContext access in controllers
- ✅ Routes follow conventions (`/api/v{version}/platform/...`)
- ✅ `[HasPermission]` used with `Permissions.*` constants
- ✅ `[ApiVersion]` and `[ProducesResponseType]` attributes present

### 7. Permissions (Rule 8.1, 8.2)
- ✅ Permissions catalog exists in `SharedKernel/Authorization/Permissions.cs`
- ✅ No magic strings found in controllers
- ✅ `Permissions.All()` method exists for seeding

### 8. Entity Configurations (Rule 5.2)
- ✅ All entities have `IEntityTypeConfiguration<T>` implementations
- ✅ Enums stored as strings using `.HasConversion<string>()`
- ✅ Configurations organized in `Configurations/Platform/` and `Configurations/Tenant/`

### 9. ICurrentUser Usage (Rule 4.3)
- ✅ Handlers use `ICurrentUser` abstraction
- ✅ No direct `HttpContext` access in handlers

---

## ❌ CRITICAL VIOLATIONS

### 1. **Infrastructure References Application** (Rule 1.1)
**Severity:** 🔴 CRITICAL  
**File:** `savi-backend/src/Savi.Infrastructure/Savi.Infrastructure.csproj`  
**Line:** 7

**Issue:**
```xml
<ProjectReference Include="..\Savi.Application\Savi.Application.csproj" />
```

**Rule Violated:**
> Infrastructure → Savi.Domain, Savi.SharedKernel, Savi.MultiTenancy  
> ❌ FORBIDDEN: Infrastructure → Savi.Application

**Impact:** Creates circular dependency risk and violates clean architecture boundaries.

**Fix Required:**
Remove the reference to `Savi.Application` from `Savi.Infrastructure.csproj`. If Infrastructure needs something from Application, it should be moved to SharedKernel or the dependency should be inverted.

---

### 2. **Query Handler Missing AsNoTracking()** (Rule 4.5)
**Severity:** 🔴 CRITICAL  
**File:** `savi-backend/src/Savi.Application/Platform/Profile/Queries/GetMyPlatformProfile/GetMyPlatformProfileQueryHandler.cs`  
**Lines:** 38-83

**Issue:**
```csharp
// Lines 38-48: Missing AsNoTracking()
var users = _platformDbContext.PlatformUsers
    .Where(u => u.Id == _currentUser.UserId && u.IsActive)
    .Select(u => new { ... })
    .Take(1)
    .ToList();

// Lines 59-66: Missing AsNoTracking()
var platformRoles = _platformDbContext.PlatformUserRoles
    .Where(ur => ur.PlatformUserId == _currentUser.UserId && ur.IsActive)
    .Join(...)
    .ToList();

// Lines 69-83: Missing AsNoTracking()
var memberships = _platformDbContext.UserTenantMemberships
    .Where(m => m.PlatformUserId == _currentUser.UserId && m.IsActive)
    .Join(...)
    .ToList();
```

**Rule Violated:**
> **ALL read-only queries MUST use `.AsNoTracking()`**

**Impact:** Unnecessary change tracking overhead, potential memory leaks, and performance degradation.

**Fix Required:**
Add `.AsNoTracking()` to all three queries in `GetMyPlatformProfileQueryHandler.cs`.

**Example Fix:**
```csharp
var users = _platformDbContext.PlatformUsers
    .AsNoTracking()  // ADD THIS
    .Where(u => u.Id == _currentUser.UserId && u.IsActive)
    .Select(u => new { ... })
    .Take(1)
    .ToList();
```

---

### 3. **Domain Organization Mismatch** (Rule 2.3)
**Severity:** 🟡 WARNING  
**File:** `savi-backend/src/Savi.Domain/Tenant/` folder

**Issue:**
Tenant entities are in `Savi.Domain/Tenant/` folder, but Rule 2.3 specifies:
```
├── Community/       # Core tenant entities (Party, Unit, etc.)
```

**Current Structure:**
```
Savi.Domain/
├── Platform/
└── Tenant/          # Should be "Community"?
    ├── CommunityUser.cs
    ├── RoleGroup.cs
    └── ...
```

**Rule Violated:**
> **Follow this exact structure in Savi.Domain:**  
> `├── Community/       # Core tenant entities (Party, Unit, etc.)`

**Impact:** Inconsistency with documented structure. May cause confusion.

**Fix Required:**
Either:
1. Rename `Tenant/` folder to `Community/` to match rules, OR
2. Update Rule 2.3 to reflect actual structure if `Tenant/` is intentional.

**Note:** This is a structural inconsistency. Verify with architect which naming is correct.

---

## ⚠️ WARNINGS & RECOMMENDATIONS

### 1. **No List Queries Found - PagedResult Validation Skipped** (Rule 4.7)
**Severity:** 🟡 INFO  
**Status:** Cannot validate - no list queries exist yet

**Rule:**
> **ALL list queries MUST return `PagedResult<T>` and accept pagination parameters**

**Recommendation:**
When implementing list queries (e.g., `ListTenantsQuery`, `ListMaintenanceRequestsQuery`), ensure they:
- Return `PagedResult<T>` (not `List<T>` or `IEnumerable<T>`)
- Accept `Page` and `PageSize` parameters
- Follow pagination pattern

**Example Pattern to Follow:**
```csharp
public record ListTenantsQuery(
    int Page = 1,
    int PageSize = 20,
    string? SearchTerm = null
) : IRequest<Result<PagedResult<TenantDto>>>;
```

---

### 2. **Controller Route Versioning** (Rule 6.4)
**Severity:** ✅ PASSING  
**Status:** Routes correctly use versioning

**Current Routes:**
- ✅ `/api/v{version:apiVersion}/platform/auth`
- ✅ `/api/v{version:apiVersion}/platform/me`
- ✅ `/api/v{version:apiVersion}/platform/tenants`

**Note:** All routes correctly follow the convention. When Tenant controllers are added, ensure they follow `/api/v{version}/tenant/...` pattern.

---

## 📊 Validation Statistics

| Category | Status | Count |
|----------|--------|-------|
| **Critical Violations** | ❌ | 2 |
| **Warnings** | ⚠️ | 1 |
| **Passing Validations** | ✅ | 9 |
| **Total Checks** | | 12 |

---

## 🔧 Required Actions

### Immediate (Critical)
1. **Remove Application reference from Infrastructure** (`Savi.Infrastructure.csproj`)
2. **Add AsNoTracking() to GetMyPlatformProfileQueryHandler** (3 locations)

### Follow-up (Warning)
3. **Clarify Domain folder naming** - Rename `Tenant/` to `Community/` OR update rules document

### Future (When Implementing)
4. **Ensure all list queries use PagedResult<T>** when adding list endpoints

---

## 📝 Notes

- The codebase shows **strong adherence** to most architectural rules
- CQRS structure is well-organized
- Controllers follow best practices
- Domain layer is properly isolated
- The violations found are **fixable** and don't indicate systemic issues

---

## ✅ Validation Checklist Summary

### ✅ Structure
- [x] Files in correct project and folder
- [x] Naming conventions followed
- [x] No new projects without approval
- [x] Dependencies respect allowed direction *(except Infrastructure→Application)*

### ✅ Domain
- [x] Entities inherit from BaseEntity
- [x] Field names match DBML exactly
- [x] No EF, HTTP, or infrastructure concerns in Domain
- [ ] Domain folder structure matches rules *(Tenant vs Community)*

### ✅ Application
- [x] CQRS pattern followed
- [x] ICurrentUser and ITenantContext used
- [ ] Queries use AsNoTracking() *(1 handler missing)*
- [ ] All list queries return PagedResult<T> *(none exist yet)*
- [x] Commands have validators
- [x] Handlers are thin

### ✅ Infrastructure
- [x] Entity configurations exist
- [x] Enums stored as strings
- [x] Service implementations in correct folders
- [ ] No reference to Application *(VIOLATION)*

### ✅ API
- [x] Controllers are thin
- [x] Routes follow conventions
- [x] [HasPermission] used with Permissions.* constants
- [x] ProducesResponseType attributes present
- [x] Version annotation present

### ✅ Permissions
- [x] Permissions catalog exists
- [x] Permission keys follow naming pattern
- [x] No magic strings

### ✅ Multi-tenancy
- [x] ITenantContext used for tenant info
- [x] No direct header access

---

**Report End**

