namespace CmsApi.Entities;

public class SeoSetting
{
    public int Id { get; set; }
    public int LandingPageId { get; set; }
    public LandingPage LandingPage { get; set; } = null!;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? Keywords { get; set; }
    public string? OgImage { get; set; }
    public string? CanonicalUrl { get; set; }
}
