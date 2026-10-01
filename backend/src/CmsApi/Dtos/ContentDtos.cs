using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public class MenuItemRequest
{
    [Required, StringLength(100)]
    public string Title { get; set; } = "";

    /// <summary>Anchor (#about), relative path or absolute URL.</summary>
    [Required, StringLength(500)]
    public string Url { get; set; } = "";

    public bool IsVisible { get; set; } = true;
}

public sealed class MenuItemCreateRequest : MenuItemRequest
{
    public int LandingPageId { get; set; }
}

public sealed record MenuItemDto(int Id, int LandingPageId, string Title, string Url, int SortOrder, bool IsVisible);

public sealed class SeoRequest
{
    [StringLength(200)]
    public string? MetaTitle { get; set; }

    [StringLength(500)]
    public string? MetaDescription { get; set; }

    [StringLength(500)]
    public string? Keywords { get; set; }

    [StringLength(500)]
    public string? OgImage { get; set; }

    [StringLength(500), Url(ErrorMessage = "Canonical URL phải là địa chỉ đầy đủ (https://...).")]
    public string? CanonicalUrl { get; set; }
}

public sealed record SeoDto(
    int LandingPageId,
    string? MetaTitle,
    string? MetaDescription,
    string? Keywords,
    string? OgImage,
    string? CanonicalUrl);

public sealed class UpdateSettingsRequest
{
    [Required, MinLength(1)]
    public Dictionary<string, string> Values { get; set; } = [];
}

public sealed class SettingValueRequest
{
    [Required, StringLength(10000)]
    public string Value { get; set; } = "";
}

public sealed record SiteSettingDto(string Key, string Value, string? Description);

public sealed class MediaUpdateRequest
{
    [StringLength(300)]
    public string? AltText { get; set; }
}

public sealed record MediaDto(int Id, string FileName, string FileUrl, string? AltText, string MimeType, long SizeBytes, DateTime CreatedAt);

public sealed class CreateUserRequest
{
    [Required, StringLength(50, MinimumLength = 3)]
    [RegularExpression("^[a-zA-Z0-9._-]+$", ErrorMessage = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới và gạch ngang.")]
    public string Username { get; set; } = "";

    [Required, StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = "";

    [Required, StringLength(50)]
    public string Role { get; set; } = "";
}

public sealed class UpdateUserRequest
{
    [Required, StringLength(50)]
    public string Role { get; set; } = "";

    /// <summary>Leave empty to keep the current password.</summary>
    [StringLength(100, MinimumLength = 8)]
    public string? NewPassword { get; set; }
}
