using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace CmsApi.Dtos;

public sealed class SectionRequest
{
    [Required, StringLength(50)]
    public string SectionType { get; set; } = "";

    [StringLength(300)]
    public string? Title { get; set; }

    [StringLength(500)]
    public string? Subtitle { get; set; }

    public string? Content { get; set; }

    public bool IsVisible { get; set; } = true;

    /// <summary>Section-specific data; must be a JSON object.</summary>
    public JsonElement? Settings { get; set; }
}

public sealed class ReorderRequest
{
    /// <summary>Owner of the items being sorted (landing page id).</summary>
    public int LandingPageId { get; set; }

    [Required, MinLength(1)]
    public List<int> OrderedIds { get; set; } = [];
}

public sealed record SectionDto(
    int Id,
    int LandingPageId,
    string SectionType,
    string? Title,
    string? Subtitle,
    string? Content,
    int SortOrder,
    bool IsVisible,
    JsonElement Settings,
    DateTime CreatedAt,
    DateTime UpdatedAt);
