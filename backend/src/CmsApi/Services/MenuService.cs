using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public sealed class MenuService(AppDbContext db)
{
    public async Task<List<MenuItemDto>> ListAsync(int landingPageId, CancellationToken ct) =>
        await db.MenuItems.AsNoTracking()
            .Where(m => m.LandingPageId == landingPageId)
            .OrderBy(m => m.SortOrder)
            .Select(m => ToDto(m))
            .ToListAsync(ct);

    public async Task<MenuItemDto> CreateAsync(MenuItemCreateRequest request, CancellationToken ct)
    {
        if (!await db.LandingPages.AnyAsync(p => p.Id == request.LandingPageId, ct))
            throw AppException.NotFound("Không tìm thấy landing page.");

        var lastOrder = await db.MenuItems
            .Where(m => m.LandingPageId == request.LandingPageId)
            .MaxAsync(m => (int?)m.SortOrder, ct);

        var item = new MenuItem { LandingPageId = request.LandingPageId, SortOrder = (lastOrder ?? -1) + 1 };
        Apply(item, request);
        db.MenuItems.Add(item);
        await db.SaveChangesAsync(ct);
        return ToDto(item);
    }

    public async Task<MenuItemDto> UpdateAsync(int id, MenuItemRequest request, CancellationToken ct)
    {
        var item = await db.MenuItems.FindAsync([id], ct) ?? throw NotFound();
        Apply(item, request);
        await db.SaveChangesAsync(ct);
        return ToDto(item);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var item = await db.MenuItems.FindAsync([id], ct) ?? throw NotFound();
        db.MenuItems.Remove(item);
        await db.SaveChangesAsync(ct);
    }

    public async Task ReorderAsync(ReorderRequest request, CancellationToken ct)
    {
        await ReorderHelper.ApplyAsync(db.MenuItems.Where(m => m.LandingPageId == request.LandingPageId), request.OrderedIds, ct);
        await db.SaveChangesAsync(ct);
    }

    private static void Apply(MenuItem item, MenuItemRequest request)
    {
        item.Title = request.Title.Trim();
        item.Url = request.Url.Trim();
        item.IsVisible = request.IsVisible;
    }

    private static MenuItemDto ToDto(MenuItem m) => new(m.Id, m.LandingPageId, m.Title, m.Url, m.SortOrder, m.IsVisible);

    private static AppException NotFound() => AppException.NotFound("Không tìm thấy mục menu.");
}
