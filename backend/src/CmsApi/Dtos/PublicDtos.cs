using System.Text.Json;

namespace CmsApi.Dtos;

public sealed record PublicSectionDto(
    int Id,
    string SectionType,
    string? Title,
    string? Subtitle,
    string? Content,
    JsonElement Settings);

public sealed record PublicMenuItemDto(string Title, string Url);

public sealed record PublicPageDto(
    string Slug,
    string Title,
    string? Description,
    DateTime UpdatedAt,
    SeoDto? Seo,
    IReadOnlyList<PublicMenuItemDto> Menu,
    IReadOnlyList<PublicSectionDto> Sections);

public sealed record PublicPageSummaryDto(string Slug, DateTime UpdatedAt);

public sealed record PreviewTokenDto(string Token);
