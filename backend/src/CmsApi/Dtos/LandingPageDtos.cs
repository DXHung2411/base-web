using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public sealed class LandingPageRequest
{
    [Required, StringLength(200)]
    public string Name { get; set; } = "";

    [Required, StringLength(100)]
    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug chỉ gồm chữ thường, số và dấu gạch ngang.")]
    public string Slug { get; set; } = "";

    [Required, StringLength(200)]
    public string Title { get; set; } = "";

    [StringLength(500)]
    public string? Description { get; set; }
}

public sealed class PublishRequest
{
    public bool IsPublished { get; set; }
}

public sealed record LandingPageDto(
    int Id,
    string Name,
    string Slug,
    string Title,
    string? Description,
    bool IsPublished,
    int SectionCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
