namespace CmsApi.Entities;

/// <summary>Timestamps maintained automatically by <see cref="Data.AppDbContext"/>.</summary>
public interface ITimestamped
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

/// <summary>Entity that can be ordered by the admin through drag and drop.</summary>
public interface ISortable
{
    int Id { get; }
    int SortOrder { get; set; }
}
