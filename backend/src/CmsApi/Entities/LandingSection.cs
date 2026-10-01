namespace CmsApi.Entities;

public class LandingSection : ITimestamped, ISortable
{
    public int Id { get; set; }
    public int LandingPageId { get; set; }
    public LandingPage LandingPage { get; set; } = null!;

    /// <summary>One of <see cref="SectionTypes.All"/>.</summary>
    public string SectionType { get; set; } = "";
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Content { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;

    /// <summary>Section-specific data (items, images, links...) as a JSON object.</summary>
    public string SettingsJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public static class SectionTypes
{
    public static readonly string[] All =
    [
        "hero", "about", "features", "services", "products", "stats", "pricing",
        "testimonials", "faq", "gallery", "cta", "contact", "custom"
    ];
}
