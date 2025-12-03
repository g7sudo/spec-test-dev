namespace Savi.SharedKernel.Authorization;

/// <summary>
/// Single source of truth for all permission keys in SAVI.
/// 
/// RULES:
/// - All permission usage in code MUST reference Permissions.* constants.
/// - Permissions.All() is used to seed PlatformDB's Permission table.
/// - If a permission does not exist here, it does not exist anywhere.
/// - Never use raw strings in [Authorize(Policy = ...)].
/// - Use [HasPermission(Permissions.Tenant.Maintenance.RequestView)] instead.
/// </summary>
public static class Permissions
{
    /// <summary>
    /// Platform-level permissions for root/admin operations.
    /// Used for tenant management, billing, support, and platform configuration.
    /// </summary>
    public static class Platform
    {
        /// <summary>
        /// Tenant management permissions.
        /// </summary>
        public static class Tenants
        {
            /// <summary>Permission to view tenant list and details.</summary>
            public const string View = "PLATFORM_TENANT_VIEW";

            /// <summary>Permission to create new tenants.</summary>
            public const string Create = "PLATFORM_TENANT_CREATE";

            /// <summary>Permission to update tenant settings.</summary>
            public const string Update = "PLATFORM_TENANT_UPDATE";

            /// <summary>Permission to manage tenant status (activate/suspend/archive).</summary>
            public const string Manage = "PLATFORM_TENANT_MANAGE";
        }

        /// <summary>
        /// Platform user management permissions.
        /// </summary>
        public static class Users
        {
            /// <summary>Permission to view platform users.</summary>
            public const string View = "PLATFORM_USER_VIEW";

            /// <summary>Permission to manage platform users.</summary>
            public const string Manage = "PLATFORM_USER_MANAGE";
        }

        /// <summary>
        /// Plan management permissions.
        /// </summary>
        public static class Plans
        {
            /// <summary>Permission to view plans.</summary>
            public const string View = "PLATFORM_PLAN_VIEW";

            /// <summary>Permission to manage plans.</summary>
            public const string Manage = "PLATFORM_PLAN_MANAGE";
        }

        /// <summary>
        /// Platform RBAC management permissions.
        /// </summary>
        public static class Rbac
        {
            /// <summary>Permission to view platform roles and permissions.</summary>
            public const string View = "PLATFORM_RBAC_VIEW";

            /// <summary>Permission to manage platform roles and permissions.</summary>
            public const string Manage = "PLATFORM_RBAC_MANAGE";
        }
    }

    /// <summary>
    /// Tenant-level permissions for community-specific operations.
    /// These are assigned to RoleGroups within each tenant.
    /// </summary>
    public static class Tenant
    {
        /// <summary>
        /// Maintenance module permissions.
        /// </summary>
        public static class Maintenance
        {
            /// <summary>Permission to view maintenance requests.</summary>
            public const string RequestView = "TENANT_MAINTENANCE_REQUEST_VIEW";

            /// <summary>Permission to create maintenance requests.</summary>
            public const string RequestCreate = "TENANT_MAINTENANCE_REQUEST_CREATE";

            /// <summary>Permission to update/manage maintenance requests.</summary>
            public const string RequestManage = "TENANT_MAINTENANCE_REQUEST_MANAGE";

            /// <summary>Permission to approve costs for maintenance work.</summary>
            public const string RequestApproveCost = "TENANT_MAINTENANCE_REQUEST_APPROVECOST";

            /// <summary>Permission to assign maintenance staff to requests.</summary>
            public const string RequestAssign = "TENANT_MAINTENANCE_REQUEST_ASSIGN";
        }

        /// <summary>
        /// Visitor management permissions.
        /// </summary>
        public static class Visitors
        {
            /// <summary>Permission to view visitor passes.</summary>
            public const string View = "TENANT_VISITOR_VIEW";

            /// <summary>Permission to create visitor passes.</summary>
            public const string Create = "TENANT_VISITOR_CREATE";

            /// <summary>Permission to manage all visitor passes (security role).</summary>
            public const string Manage = "TENANT_VISITOR_MANAGE";
        }

        /// <summary>
        /// Amenity management permissions.
        /// </summary>
        public static class Amenities
        {
            /// <summary>Permission to view amenities and bookings.</summary>
            public const string View = "TENANT_AMENITY_VIEW";

            /// <summary>Permission to book amenities.</summary>
            public const string Book = "TENANT_AMENITY_BOOK";

            /// <summary>Permission to manage amenity configuration.</summary>
            public const string Manage = "TENANT_AMENITY_MANAGE";

            /// <summary>Permission to approve/reject bookings.</summary>
            public const string ApproveBookings = "TENANT_AMENITY_APPROVE_BOOKINGS";
        }

        /// <summary>
        /// Announcement permissions.
        /// </summary>
        public static class Announcements
        {
            /// <summary>Permission to view announcements.</summary>
            public const string View = "TENANT_ANNOUNCEMENT_VIEW";

            /// <summary>Permission to create/manage announcements.</summary>
            public const string Manage = "TENANT_ANNOUNCEMENT_MANAGE";
        }

        /// <summary>
        /// Marketplace permissions.
        /// </summary>
        public static class Marketplace
        {
            /// <summary>Permission to view marketplace listings.</summary>
            public const string View = "TENANT_MARKETPLACE_VIEW";

            /// <summary>Permission to create marketplace listings.</summary>
            public const string Create = "TENANT_MARKETPLACE_CREATE";

            /// <summary>Permission to moderate marketplace listings.</summary>
            public const string Moderate = "TENANT_MARKETPLACE_MODERATE";
        }

        /// <summary>
        /// Community structure permissions (blocks, floors, units).
        /// </summary>
        public static class Community
        {
            /// <summary>Permission to view community structure.</summary>
            public const string View = "TENANT_COMMUNITY_VIEW";

            /// <summary>Permission to manage community structure.</summary>
            public const string Manage = "TENANT_COMMUNITY_MANAGE";
        }

        /// <summary>
        /// Community user management permissions.
        /// </summary>
        public static class Users
        {
            /// <summary>Permission to view community users.</summary>
            public const string View = "TENANT_USER_VIEW";

            /// <summary>Permission to manage community users.</summary>
            public const string Manage = "TENANT_USER_MANAGE";

            /// <summary>Permission to invite users to the community.</summary>
            public const string Invite = "TENANT_USER_INVITE";
        }

        /// <summary>
        /// Lease and residency permissions.
        /// </summary>
        public static class Leases
        {
            /// <summary>Permission to view leases.</summary>
            public const string View = "TENANT_LEASE_VIEW";

            /// <summary>Permission to manage leases.</summary>
            public const string Manage = "TENANT_LEASE_MANAGE";
        }

        /// <summary>
        /// Party management permissions (individuals, companies, entities).
        /// </summary>
        public static class Parties
        {
            /// <summary>Permission to view parties and their details.</summary>
            public const string View = "TENANT_PARTY_VIEW";

            /// <summary>Permission to create, update, and delete parties.</summary>
            public const string Manage = "TENANT_PARTY_MANAGE";
        }

        /// <summary>
        /// Ownership management permissions (unit ownership records).
        /// </summary>
        public static class Ownership
        {
            /// <summary>Permission to view ownership records and history.</summary>
            public const string View = "TENANT_OWNERSHIP_VIEW";

            /// <summary>Permission to manage ownership (add, transfer, end ownership).</summary>
            public const string Manage = "TENANT_OWNERSHIP_MANAGE";
        }

        /// <summary>
        /// Tenant RBAC management permissions.
        /// </summary>
        public static class Rbac
        {
            /// <summary>Permission to view tenant roles and permissions.</summary>
            public const string View = "TENANT_RBAC_VIEW";

            /// <summary>Permission to manage tenant roles and permissions.</summary>
            public const string Manage = "TENANT_RBAC_MANAGE";
        }
    }

    /// <summary>
    /// Returns all permission definitions for seeding the Permission table.
    /// </summary>
    public static IEnumerable<PermissionDefinition> All()
    {
        // Platform permissions
        yield return new PermissionDefinition(
            Platform.Tenants.View, PermissionScope.Platform, "Tenants", "View",
            "View tenant list and details.");

        yield return new PermissionDefinition(
            Platform.Tenants.Create, PermissionScope.Platform, "Tenants", "Create",
            "Create new tenants.");

        yield return new PermissionDefinition(
            Platform.Tenants.Update, PermissionScope.Platform, "Tenants", "Update",
            "Update tenant settings.");

        yield return new PermissionDefinition(
            Platform.Tenants.Manage, PermissionScope.Platform, "Tenants", "Manage",
            "Manage tenant status (activate/suspend/archive).");

        yield return new PermissionDefinition(
            Platform.Users.View, PermissionScope.Platform, "Users", "View",
            "View platform users.");

        yield return new PermissionDefinition(
            Platform.Users.Manage, PermissionScope.Platform, "Users", "Manage",
            "Manage platform users.");

        yield return new PermissionDefinition(
            Platform.Plans.View, PermissionScope.Platform, "Plans", "View",
            "View plans.");

        yield return new PermissionDefinition(
            Platform.Plans.Manage, PermissionScope.Platform, "Plans", "Manage",
            "Manage plans.");

        // Platform permissions - RBAC
        yield return new PermissionDefinition(
            Platform.Rbac.View, PermissionScope.Platform, "Rbac", "View",
            "View platform roles and permissions.");

        yield return new PermissionDefinition(
            Platform.Rbac.Manage, PermissionScope.Platform, "Rbac", "Manage",
            "Manage platform roles and permissions.");

        // Tenant permissions - Maintenance
        yield return new PermissionDefinition(
            Tenant.Maintenance.RequestView, PermissionScope.Tenant, "Maintenance", "View",
            "View maintenance requests.");

        yield return new PermissionDefinition(
            Tenant.Maintenance.RequestCreate, PermissionScope.Tenant, "Maintenance", "Create",
            "Create maintenance requests.");

        yield return new PermissionDefinition(
            Tenant.Maintenance.RequestManage, PermissionScope.Tenant, "Maintenance", "Manage",
            "Update and manage maintenance requests.");

        yield return new PermissionDefinition(
            Tenant.Maintenance.RequestApproveCost, PermissionScope.Tenant, "Maintenance", "ApproveCost",
            "Approve costs for maintenance work.");

        yield return new PermissionDefinition(
            Tenant.Maintenance.RequestAssign, PermissionScope.Tenant, "Maintenance", "Assign",
            "Assign maintenance staff to requests.");

        // Tenant permissions - Visitors
        yield return new PermissionDefinition(
            Tenant.Visitors.View, PermissionScope.Tenant, "Visitors", "View",
            "View visitor passes.");

        yield return new PermissionDefinition(
            Tenant.Visitors.Create, PermissionScope.Tenant, "Visitors", "Create",
            "Create visitor passes.");

        yield return new PermissionDefinition(
            Tenant.Visitors.Manage, PermissionScope.Tenant, "Visitors", "Manage",
            "Manage all visitor passes (security role).");

        // Tenant permissions - Amenities
        yield return new PermissionDefinition(
            Tenant.Amenities.View, PermissionScope.Tenant, "Amenities", "View",
            "View amenities and bookings.");

        yield return new PermissionDefinition(
            Tenant.Amenities.Book, PermissionScope.Tenant, "Amenities", "Book",
            "Book amenities.");

        yield return new PermissionDefinition(
            Tenant.Amenities.Manage, PermissionScope.Tenant, "Amenities", "Manage",
            "Manage amenity configuration.");

        yield return new PermissionDefinition(
            Tenant.Amenities.ApproveBookings, PermissionScope.Tenant, "Amenities", "ApproveBookings",
            "Approve or reject amenity bookings.");

        // Tenant permissions - Announcements
        yield return new PermissionDefinition(
            Tenant.Announcements.View, PermissionScope.Tenant, "Announcements", "View",
            "View announcements.");

        yield return new PermissionDefinition(
            Tenant.Announcements.Manage, PermissionScope.Tenant, "Announcements", "Manage",
            "Create and manage announcements.");

        // Tenant permissions - Marketplace
        yield return new PermissionDefinition(
            Tenant.Marketplace.View, PermissionScope.Tenant, "Marketplace", "View",
            "View marketplace listings.");

        yield return new PermissionDefinition(
            Tenant.Marketplace.Create, PermissionScope.Tenant, "Marketplace", "Create",
            "Create marketplace listings.");

        yield return new PermissionDefinition(
            Tenant.Marketplace.Moderate, PermissionScope.Tenant, "Marketplace", "Moderate",
            "Moderate marketplace listings (approve/reject).");

        // Tenant permissions - Community
        yield return new PermissionDefinition(
            Tenant.Community.View, PermissionScope.Tenant, "Community", "View",
            "View community structure (blocks, floors, units).");

        yield return new PermissionDefinition(
            Tenant.Community.Manage, PermissionScope.Tenant, "Community", "Manage",
            "Manage community structure.");

        // Tenant permissions - Users
        yield return new PermissionDefinition(
            Tenant.Users.View, PermissionScope.Tenant, "Users", "View",
            "View community users.");

        yield return new PermissionDefinition(
            Tenant.Users.Manage, PermissionScope.Tenant, "Users", "Manage",
            "Manage community users.");

        yield return new PermissionDefinition(
            Tenant.Users.Invite, PermissionScope.Tenant, "Users", "Invite",
            "Invite users to the community.");

        // Tenant permissions - Leases
        yield return new PermissionDefinition(
            Tenant.Leases.View, PermissionScope.Tenant, "Leases", "View",
            "View leases.");

        yield return new PermissionDefinition(
            Tenant.Leases.Manage, PermissionScope.Tenant, "Leases", "Manage",
            "Manage leases.");

        // Tenant permissions - Parties
        yield return new PermissionDefinition(
            Tenant.Parties.View, PermissionScope.Tenant, "Parties", "View",
            "View parties and their details (addresses, contacts).");

        yield return new PermissionDefinition(
            Tenant.Parties.Manage, PermissionScope.Tenant, "Parties", "Manage",
            "Create, update, and delete parties.");

        // Tenant permissions - Ownership
        yield return new PermissionDefinition(
            Tenant.Ownership.View, PermissionScope.Tenant, "Ownership", "View",
            "View unit ownership records and history.");

        yield return new PermissionDefinition(
            Tenant.Ownership.Manage, PermissionScope.Tenant, "Ownership", "Manage",
            "Manage unit ownership (add, transfer, end ownership).");
    }
}

