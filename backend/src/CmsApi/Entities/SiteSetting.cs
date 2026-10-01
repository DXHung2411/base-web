namespace CmsApi.Entities;

/// <summary>Key/value setting. Keys are dotted, e.g. company.phone or theme.primaryColor.</summary>
public class SiteSetting
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string? Description { get; set; }
}
