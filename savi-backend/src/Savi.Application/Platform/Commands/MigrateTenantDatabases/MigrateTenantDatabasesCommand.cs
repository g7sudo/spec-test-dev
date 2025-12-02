using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Commands.MigrateTenantDatabases;

/// <summary>
/// Admin command to apply pending migrations to all tenant databases.
/// </summary>
public record MigrateTenantDatabasesCommand : IRequest<Result<MigrationResultDto>>;
