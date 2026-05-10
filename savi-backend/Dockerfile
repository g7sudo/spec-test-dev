# ---- Stage 1: Build & publish the .NET app ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and all project files first (better layer caching)
COPY Savi.sln ./
COPY src/Savi.Api/Savi.Api.csproj src/Savi.Api/
COPY src/Savi.Application/Savi.Application.csproj src/Savi.Application/
COPY src/Savi.Domain/Savi.Domain.csproj src/Savi.Domain/
COPY src/Savi.Infrastructure/Savi.Infrastructure.csproj src/Savi.Infrastructure/
COPY src/Savi.MultiTenancy/Savi.MultiTenancy.csproj src/Savi.MultiTenancy/
COPY src/Savi.SharedKernel/Savi.SharedKernel.csproj src/Savi.SharedKernel/
COPY src/Savi.BackgroundJobs/Savi.BackgroundJobs.csproj src/Savi.BackgroundJobs/

# Restore dependencies (cached unless .csproj files change)
RUN dotnet restore

# Copy the rest of the source code and publish
COPY . .
RUN dotnet publish src/Savi.Api/Savi.Api.csproj -c Release -o /app/publish --no-restore

# ---- Stage 2: Production runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy the published .NET app from the build stage
COPY --from=build /app/publish .

# Copy production config from the Mac Mini config folder (~/savi-config/).
# This file is injected at build time via docker-compose `additional_contexts`.
# It is NEVER committed to git — it lives only on the Mac Mini.
# Contains: DB connection strings, Firebase credentials, etc.
COPY --from=config appsettings.json ./appsettings.json

# Grant appuser ownership of the app directory
RUN chown -R appuser:appuser /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

USER appuser

EXPOSE 8080

# .NET config system loads appsettings.json first, then appsettings.json
# on top — Production values win for any keys that overlap.
ENTRYPOINT ["dotnet", "Savi.Api.dll"]
