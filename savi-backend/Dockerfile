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

COPY --from=build /app/publish .

# Render injects PORT env var; default to 8080 for local testing
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

USER appuser

EXPOSE 8080

# Copy Render secret files (appsettings + firebase credentials) into the app directory at startup
ENTRYPOINT ["sh", "-c", "cp /etc/secrets/*.json /app/ 2>/dev/null; dotnet Savi.Api.dll"]
