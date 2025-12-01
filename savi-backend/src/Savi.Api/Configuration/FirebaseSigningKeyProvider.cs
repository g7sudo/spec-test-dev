using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using Microsoft.IdentityModel.Tokens;

namespace Savi.Api.Configuration;

/// <summary>
/// Simple JWKS cache for Firebase public signing keys.
/// </summary>
/// <remarks>
/// Firebase rotates the keys that sign ID tokens. Instead of hitting Google's
/// JWKS endpoint for every request we cache the keys for a short period.
///
/// NOTE: This type intentionally avoids DI dependencies so it can be created
/// early during authentication configuration.
/// </remarks>
internal sealed class FirebaseSigningKeyProvider
{
    private const string DefaultJwksUri =
        "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

    private static readonly HttpClient HttpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(10)
    };

    private readonly string _jwksUri;
    private readonly TimeSpan _cacheDuration;
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    private IReadOnlyCollection<SecurityKey> _cachedKeys = Array.Empty<SecurityKey>();
    private DateTimeOffset _expiresAt = DateTimeOffset.MinValue;

    public FirebaseSigningKeyProvider(string? jwksUri = null, TimeSpan? cacheDuration = null)
    {
        _jwksUri = string.IsNullOrWhiteSpace(jwksUri) ? DefaultJwksUri : jwksUri!;
        _cacheDuration = cacheDuration ?? TimeSpan.FromHours(1);

        HttpClient.DefaultRequestHeaders.CacheControl = new CacheControlHeaderValue
        {
            NoCache = true,
            NoStore = true
        };
    }

    /// <summary>
    /// Returns the cached signing keys, refreshing from Firebase when needed.
    /// </summary>
    public IReadOnlyCollection<SecurityKey> GetSigningKeys()
    {
        // Serve from cache whenever possible to avoid blocking auth requests.
        if (_cachedKeys.Count > 0 && DateTimeOffset.UtcNow < _expiresAt)
        {
            return _cachedKeys;
        }

        _refreshLock.Wait();
        try
        {
            if (_cachedKeys.Count > 0 && DateTimeOffset.UtcNow < _expiresAt)
            {
                return _cachedKeys;
            }

            // Hit Firebase JWKS endpoint to grab the latest RSA keys that sign ID tokens.
            var jwksJson = HttpClient
                .GetStringAsync(_jwksUri)
                .GetAwaiter()
                .GetResult();

            var keys = new JsonWebKeySet(jwksJson).GetSigningKeys().ToList();
            if (keys == null || keys.Count == 0)
            {
                throw new InvalidOperationException($"Firebase JWKS endpoint '{_jwksUri}' returned no signing keys.");
            }

            // Cache for a short duration so we react quickly to Firebase key rotations.
            _cachedKeys = keys;
            _expiresAt = DateTimeOffset.UtcNow.Add(_cacheDuration);

            return _cachedKeys;
        }
        finally
        {
            _refreshLock.Release();
        }
    }
}

