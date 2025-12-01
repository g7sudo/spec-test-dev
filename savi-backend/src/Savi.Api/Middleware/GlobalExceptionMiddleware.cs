using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Savi.MultiTenancy;

namespace Savi.Api.Middleware;

/// <summary>
/// Global exception handling middleware.
/// 
/// Logs all unhandled exceptions with context (tenant/user/correlation)
/// and returns a structured error response (ProblemDetails).
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Get tenant context if available
        var tenantContext = context.RequestServices.GetService<ITenantContext>();
        var correlationId = context.TraceIdentifier;

        // Log the exception with context
        _logger.LogError(
            exception,
            "Unhandled exception occurred. TenantId: {TenantId}, CorrelationId: {CorrelationId}, Path: {Path}",
            tenantContext?.TenantId,
            correlationId,
            context.Request.Path);

        // Determine status code and message based on exception type
        var (statusCode, title, detail) = exception switch
        {
            ArgumentException argEx => (
                HttpStatusCode.BadRequest,
                "Bad Request",
                argEx.Message),

            InvalidOperationException invOpEx => (
                HttpStatusCode.BadRequest,
                "Invalid Operation",
                invOpEx.Message),

            UnauthorizedAccessException => (
                HttpStatusCode.Forbidden,
                "Forbidden",
                "You do not have permission to perform this action."),

            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "Not Found",
                "The requested resource was not found."),

            _ => (
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                "An unexpected error occurred. Please try again later.")
        };

        // Create ProblemDetails response
        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = correlationId
            }
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }
}

