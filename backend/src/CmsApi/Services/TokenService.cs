using System.Security.Claims;
using System.Text;
using CmsApi.Entities;
using CmsApi.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace CmsApi.Services;

public sealed class TokenService(IOptions<JwtOptions> options)
{
    private const string PreviewAudience = "cms-preview";
    private static readonly TimeSpan PreviewLifetime = TimeSpan.FromMinutes(10);

    private readonly JwtOptions _options = options.Value;

    public static SymmetricSecurityKey CreateKey(string secret) => new(Encoding.UTF8.GetBytes(secret));

    public (string Token, DateTime ExpiresAt) Create(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_options.ExpiryMinutes);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
            [
                new Claim("sub", user.Id.ToString()),
                new Claim("name", user.Username),
                new Claim("role", user.Role.Name)
            ]),
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Expires = expiresAt,
            SigningCredentials = new SigningCredentials(CreateKey(_options.Secret), SecurityAlgorithms.HmacSha256)
        };
        return (new JsonWebTokenHandler().CreateToken(descriptor), expiresAt);
    }

    /// <summary>Short-lived, read-only token that lets the website render one unpublished page.</summary>
    public string CreatePreviewToken(int landingPageId)
    {
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([new Claim("preview", landingPageId.ToString())]),
            Issuer = _options.Issuer,
            Audience = PreviewAudience,
            Expires = DateTime.UtcNow.Add(PreviewLifetime),
            SigningCredentials = new SigningCredentials(CreateKey(_options.Secret), SecurityAlgorithms.HmacSha256)
        };
        return new JsonWebTokenHandler().CreateToken(descriptor);
    }

    public async Task<bool> IsValidPreviewTokenAsync(string token, int landingPageId)
    {
        var result = await new JsonWebTokenHandler().ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidIssuer = _options.Issuer,
            ValidAudience = PreviewAudience,
            IssuerSigningKey = CreateKey(_options.Secret),
            ClockSkew = TimeSpan.FromMinutes(1)
        });
        return result.IsValid
            && result.Claims.TryGetValue("preview", out var claim)
            && claim?.ToString() == landingPageId.ToString();
    }
}
