using Audit.Core;
using Audit.EntityFramework;
using Microsoft.Extensions.DependencyInjection;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;
using System.Text.Json;

namespace Savi.Infrastructure.Auditing;

/// <summary>
/// Configuration for Audit.NET integration.
/// Sets up automatic EF Core change tracking and saves to PlatformAuditLog.
/// </summary>
public static class AuditConfiguration
{
    /// <summary>
    /// Configures Audit.NET to track EF Core changes and save to PlatformAuditLog.
    /// </summary>
    public static IServiceCollection AddAuditLogging(this IServiceCollection services)
    {
        // Configure the global Audit.NET settings
        Audit.Core.Configuration.Setup()
            .UseCustomProvider(new PlatformAuditDataProvider(services));

        // Configure Entity Framework auditing
        Audit.EntityFramework.Configuration.Setup()
            .ForContext<PlatformDbContext>(config => config
                .IncludeEntityObjects()
                .AuditEventType("EF:{context}:{database}"))
            .UseOptOut(); // Audit all entities by default, use [AuditIgnore] to exclude

        return services;
    }
}

/// <summary>
/// Custom Audit.NET data provider that saves audit events to PlatformAuditLog.
/// </summary>
public class PlatformAuditDataProvider : AuditDataProvider
{
    private readonly IServiceCollection _services;
    private IServiceProvider? _serviceProvider;

    public PlatformAuditDataProvider(IServiceCollection services)
    {
        _services = services;
    }

    /// <summary>
    /// Sets the service provider after DI container is built.
    /// </summary>
    public void SetServiceProvider(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override object InsertEvent(AuditEvent auditEvent)
    {
        return InsertEventAsync(auditEvent).GetAwaiter().GetResult();
    }

    public override async Task<object> InsertEventAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        if (_serviceProvider == null) return Task.FromResult<object>(Guid.Empty);

        // Only process EF events
        if (auditEvent is not AuditEventEntityFramework efEvent)
            return Guid.Empty;

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();

        var auditLogs = new List<PlatformAuditLog>();

        foreach (var entry in efEvent.EntityFrameworkEvent?.Entries ?? [])
        {
            // Skip audit log entries to avoid recursion
            if (entry.EntityType?.Name == nameof(PlatformAuditLog))
                continue;

            var action = entry.Action switch
            {
                "Insert" => $"{entry.EntityType?.Name?.ToUpperInvariant()}_CREATED",
                "Update" => $"{entry.EntityType?.Name?.ToUpperInvariant()}_UPDATED",
                "Delete" => $"{entry.EntityType?.Name?.ToUpperInvariant()}_DELETED",
                _ => entry.Action
            };

            var entityId = GetEntityId(entry);

            var auditLog = PlatformAuditLog.Create(
                action: action,
                entityType: entry.EntityType?.Name ?? "Unknown",
                entityId: entityId,
                platformUserId: GetCurrentUserId(efEvent),
                tenantId: GetCurrentTenantId(efEvent),
                oldValues: entry.Action != "Insert" ? SerializeValues(entry.ColumnValues) : null,
                newValues: entry.Action != "Delete" ? SerializeValues(entry.ColumnValues) : null,
                correlationId: auditEvent.CustomFields?.GetValueOrDefault("CorrelationId")?.ToString()
            );

            auditLogs.Add(auditLog);
        }

        if (auditLogs.Count > 0)
        {
            dbContext.PlatformAuditLogsSet.AddRange(auditLogs);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return auditLogs.FirstOrDefault()?.Id ?? Guid.Empty;
    }

    public override void ReplaceEvent(object eventId, AuditEvent auditEvent)
    {
        // Not implementing replace - we only insert
    }

    public override Task ReplaceEventAsync(object eventId, AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        // Not implementing replace - we only insert
        return Task.CompletedTask;
    }

    private static string GetEntityId(EventEntry entry)
    {
        // Try to get the Id from primary key values
        if (entry.PrimaryKey != null && entry.PrimaryKey.Count > 0)
        {
            return string.Join("_", entry.PrimaryKey.Values);
        }

        // Fall back to column values
        if (entry.ColumnValues?.TryGetValue("Id", out var id) == true)
        {
            return id?.ToString() ?? "unknown";
        }

        return "unknown";
    }

    private static Guid? GetCurrentUserId(AuditEventEntityFramework efEvent)
    {
        // Try to get from custom fields set by middleware
        if (efEvent.CustomFields?.TryGetValue("UserId", out var userId) == true)
        {
            if (userId is Guid guidUserId) return guidUserId;
            if (Guid.TryParse(userId?.ToString(), out var parsed)) return parsed;
        }
        return null;
    }

    private static Guid? GetCurrentTenantId(AuditEventEntityFramework efEvent)
    {
        // Try to get from custom fields set by middleware
        if (efEvent.CustomFields?.TryGetValue("TenantId", out var tenantId) == true)
        {
            if (tenantId is Guid guidTenantId) return guidTenantId;
            if (Guid.TryParse(tenantId?.ToString(), out var parsed)) return parsed;
        }
        return null;
    }

    private static string? SerializeValues(IDictionary<string, object>? values)
    {
        if (values == null || values.Count == 0)
            return null;

        try
        {
            return JsonSerializer.Serialize(values, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
        }
        catch
        {
            return null;
        }
    }
}

