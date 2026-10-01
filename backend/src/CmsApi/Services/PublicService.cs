using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

/// <summary>Read-only view of published content for the public website.</summary>
public sealed class PublicService(AppDbContext db)
{
    public async Task<List<PublicPageSummaryDto>> ListPublishedPagesAsync(CancellationToken ct) =>
        await db.LandingPages.AsNoTracking()
            .Where(p => p.IsPublished)
            .OrderBy(p => p.Slug)
            .Select(p => new PublicPageSummaryDto(p.Slug, p.UpdatedAt))
            .ToListAsync(ct);

    public async Task<PublicPageDto> GetPublishedPageAsync(string slug, CancellationToken ct) =>
        await GetPageAsync(p => p.Slug == slug && p.IsPublished, ct);

    /// <summary>Same shape as the public page, but ignores the published flag (used by admin preview).</summary>
    public async Task<PublicPageDto> GetPageForPreviewAsync(int landingPageId, CancellationToken ct) =>
        await GetPageAsync(p => p.Id == landingPageId, ct);

    private async Task<PublicPageDto> GetPageAsync(System.Linq.Expressions.Expression<Func<Entities.LandingPage, bool>> filter, CancellationToken ct)
    {
        var page = await db.LandingPages.AsNoTracking().AsSplitQuery()
            .Include(p => p.Seo)
            .Include(p => p.MenuItems)
            .Include(p => p.Sections)
            .FirstOrDefaultAsync(filter, ct)
            ?? throw AppException.NotFound("Không tìm thấy trang.");

        var menu = page.MenuItems
            .Where(m => m.IsVisible)
            .OrderBy(m => m.SortOrder)
            .Select(m => new PublicMenuItemDto(m.Title, m.Url))
            .ToList();
        var sections = page.Sections
            .Where(s => s.IsVisible)
            .OrderBy(s => s.SortOrder)
            .Select(s => new PublicSectionDto(s.Id, s.SectionType, s.Title, s.Subtitle, s.Content, SectionSettings.Parse(s.SettingsJson)))
            .ToList();

        return new PublicPageDto(
            page.Slug, page.Title, page.Description, page.UpdatedAt,
            page.Seo is null ? null : SeoService.ToDto(page.Id, page.Seo), menu, sections);
    }
}
