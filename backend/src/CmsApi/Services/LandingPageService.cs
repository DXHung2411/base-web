using System.Linq.Expressions;
using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public sealed class LandingPageService(AppDbContext db)
{
    private static readonly Expression<Func<LandingPage, LandingPageDto>> ToDto = p => new LandingPageDto(
        p.Id, p.Name, p.Slug, p.Title, p.Description, p.IsPublished, p.Sections.Count, p.CreatedAt, p.UpdatedAt);

    public async Task<PagedResult<LandingPageDto>> ListAsync(
        string? search, bool? isPublished, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.LandingPages.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => p.Name.Contains(term) || p.Slug.Contains(term) || p.Title.Contains(term));
        }
        if (isPublished is not null) query = query.Where(p => p.IsPublished == isPublished);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToDto)
            .ToListAsync(ct);
        return new PagedResult<LandingPageDto>(items, total, page, pageSize);
    }

    public async Task<LandingPageDto> GetAsync(int id, CancellationToken ct) =>
        await db.LandingPages.AsNoTracking().Where(p => p.Id == id).Select(ToDto).FirstOrDefaultAsync(ct)
        ?? throw NotFound();

    public async Task<LandingPageDto> CreateAsync(LandingPageRequest request, CancellationToken ct)
    {
        await EnsureSlugAvailableAsync(request.Slug, null, ct);
        var page = new LandingPage();
        Apply(page, request);
        db.LandingPages.Add(page);
        await db.SaveChangesAsync(ct);
        return await GetAsync(page.Id, ct);
    }

    public async Task<LandingPageDto> UpdateAsync(int id, LandingPageRequest request, CancellationToken ct)
    {
        var page = await db.LandingPages.FindAsync([id], ct) ?? throw NotFound();
        await EnsureSlugAvailableAsync(request.Slug, id, ct);
        Apply(page, request);
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<LandingPageDto> SetPublishedAsync(int id, bool isPublished, CancellationToken ct)
    {
        var page = await db.LandingPages.FindAsync([id], ct) ?? throw NotFound();
        page.IsPublished = isPublished;
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var page = await db.LandingPages.FindAsync([id], ct) ?? throw NotFound();
        var isHome = await db.SiteSettings.AnyAsync(s => s.Key == SettingKeys.HomeSlug && s.Value == page.Slug, ct);
        if (isHome) throw AppException.Conflict("Không thể xóa trang đang được đặt làm trang chủ.");

        db.LandingPages.Remove(page);
        await db.SaveChangesAsync(ct);
    }

    private static void Apply(LandingPage page, LandingPageRequest request)
    {
        page.Name = request.Name.Trim();
        page.Slug = request.Slug;
        page.Title = request.Title.Trim();
        page.Description = request.Description?.Trim();
    }

    private async Task EnsureSlugAvailableAsync(string slug, int? ignoreId, CancellationToken ct)
    {
        if (await db.LandingPages.AnyAsync(p => p.Slug == slug && p.Id != ignoreId, ct))
            throw AppException.Conflict("Slug này đã được sử dụng.");
    }

    private static AppException NotFound() => AppException.NotFound("Không tìm thấy landing page.");
}
