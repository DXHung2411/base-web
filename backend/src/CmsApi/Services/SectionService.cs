using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public sealed class SectionService(AppDbContext db)
{
    public async Task<List<SectionDto>> ListAsync(int landingPageId, CancellationToken ct)
    {
        await EnsurePageExistsAsync(landingPageId, ct);
        var sections = await db.LandingSections.AsNoTracking()
            .Where(s => s.LandingPageId == landingPageId)
            .OrderBy(s => s.SortOrder)
            .ToListAsync(ct);
        return sections.Select(ToDto).ToList();
    }

    public async Task<SectionDto> CreateAsync(int landingPageId, SectionRequest request, CancellationToken ct)
    {
        await EnsurePageExistsAsync(landingPageId, ct);
        var lastOrder = await db.LandingSections
            .Where(s => s.LandingPageId == landingPageId)
            .MaxAsync(s => (int?)s.SortOrder, ct);

        var section = new LandingSection { LandingPageId = landingPageId, SortOrder = (lastOrder ?? -1) + 1 };
        Apply(section, request);
        db.LandingSections.Add(section);
        await db.SaveChangesAsync(ct);
        await TouchPageAsync(landingPageId, ct);
        return ToDto(section);
    }

    public async Task<SectionDto> UpdateAsync(int id, SectionRequest request, CancellationToken ct)
    {
        var section = await db.LandingSections.FindAsync([id], ct) ?? throw NotFound();
        Apply(section, request);
        await db.SaveChangesAsync(ct);
        await TouchPageAsync(section.LandingPageId, ct);
        return ToDto(section);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var section = await db.LandingSections.FindAsync([id], ct) ?? throw NotFound();
        db.LandingSections.Remove(section);
        await db.SaveChangesAsync(ct);
        await TouchPageAsync(section.LandingPageId, ct);
    }

    public async Task ReorderAsync(ReorderRequest request, CancellationToken ct)
    {
        await EnsurePageExistsAsync(request.LandingPageId, ct);
        await ReorderHelper.ApplyAsync(db.LandingSections.Where(s => s.LandingPageId == request.LandingPageId), request.OrderedIds, ct);
        await db.SaveChangesAsync(ct);
        await TouchPageAsync(request.LandingPageId, ct);
    }

    public static SectionDto ToDto(LandingSection s) => new(
        s.Id, s.LandingPageId, s.SectionType, s.Title, s.Subtitle, s.Content, s.SortOrder, s.IsVisible,
        SectionSettings.Parse(s.SettingsJson), s.CreatedAt, s.UpdatedAt);

    private static void Apply(LandingSection section, SectionRequest request)
    {
        if (!SectionTypes.All.Contains(request.SectionType))
            throw AppException.BadRequest($"Loại section '{request.SectionType}' không được hỗ trợ.");

        section.SectionType = request.SectionType;
        section.Title = request.Title?.Trim();
        section.Subtitle = request.Subtitle?.Trim();
        section.Content = request.Content;
        section.IsVisible = request.IsVisible;
        section.SettingsJson = SectionSettings.ToJson(request.Settings);
    }

    private async Task EnsurePageExistsAsync(int landingPageId, CancellationToken ct)
    {
        if (!await db.LandingPages.AnyAsync(p => p.Id == landingPageId, ct))
            throw AppException.NotFound("Không tìm thấy landing page.");
    }

    /// <summary>Section edits count as page edits (used for sitemap lastmod and caching).</summary>
    private Task<int> TouchPageAsync(int landingPageId, CancellationToken ct) =>
        db.LandingPages.Where(p => p.Id == landingPageId)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.UpdatedAt, DateTime.UtcNow), ct);

    private static AppException NotFound() => AppException.NotFound("Không tìm thấy section.");
}
