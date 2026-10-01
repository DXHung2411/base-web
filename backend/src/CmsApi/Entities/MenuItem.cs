namespace CmsApi.Entities;

public class MenuItem : ISortable
{
    public int Id { get; set; }
    public int LandingPageId { get; set; }
    public LandingPage LandingPage { get; set; } = null!;
    public string Title { get; set; } = "";
    public string Url { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}
