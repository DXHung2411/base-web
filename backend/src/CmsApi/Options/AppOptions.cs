using System.ComponentModel.DataAnnotations;

namespace CmsApi.Options;

public sealed class JwtOptions
{
    [Required, MinLength(32)]
    public string Secret { get; set; } = "";

    [Required]
    public string Issuer { get; set; } = "";

    [Required]
    public string Audience { get; set; } = "";

    [Range(5, 60 * 24 * 30)]
    public int ExpiryMinutes { get; set; } = 480;
}

public sealed class StorageOptions
{
    /// <summary>Folder for uploaded files. Relative paths resolve against the content root.</summary>
    [Required]
    public string UploadPath { get; set; } = "uploads";

    [Range(1, 100)]
    public int MaxFileSizeMb { get; set; } = 5;
}

public sealed class SeedOptions
{
    public string AdminUsername { get; set; } = "admin";

    /// <summary>The admin account is only created when a password is configured.</summary>
    public string? AdminPassword { get; set; }
}
