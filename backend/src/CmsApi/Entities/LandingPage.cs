namespace CmsApi.Entities;

public class LandingPage : ITimestamped
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<LandingSection> Sections { get; set; } = [];
    public List<MenuItem> MenuItems { get; set; } = [];
    public SeoSetting? Seo { get; set; }
}
