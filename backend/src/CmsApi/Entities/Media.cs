namespace CmsApi.Entities;

public class Media
{
    public int Id { get; set; }

    /// <summary>Original file name as uploaded.</summary>
    public string FileName { get; set; } = "";

    /// <summary>Public URL relative to the API origin, e.g. /uploads/2026/10/photo-1a2b3c4d.webp.</summary>
    public string FileUrl { get; set; } = "";
    public string? AltText { get; set; }
    public string MimeType { get; set; } = "";
    public long SizeBytes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
