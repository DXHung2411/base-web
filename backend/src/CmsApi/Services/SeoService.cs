using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public sealed class SeoService(AppDbContext db)
{
    public async Task<SeoDto> GetAsync(int landingPageId, CancellationToken ct)
    {
        await EnsurePageExistsAsync(landingPageId, ct);
        var seo = await db.SeoSettings.AsNoTracking().FirstOrDefaultAsync(s => s.LandingPageId == landingPageId, ct);
        return ToDto(landingPageId, seo);
    }

    public async Task<SeoDto> UpsertAsync(int landingPageId, SeoRequest request, CancellationToken ct)
    {
        await EnsurePageExistsAsync(landingPageId, ct);
        var seo = await db.SeoSettings.FirstOrDefaultAsync(s => s.LandingPageId == landingPageId, ct);
        if (seo is null)
        {
            seo = new SeoSetting { LandingPageId = landingPageId };
            db.SeoSettings.Add(seo);
        }

        seo.MetaTitle = Clean(request.MetaTitle);
        seo.MetaDescription = Clean(request.MetaDescription);
        seo.Keywords = Clean(request.Keywords);
        seo.OgImage = Clean(request.OgImage);
        seo.CanonicalUrl = Clean(request.CanonicalUrl);
        await db.SaveChangesAsync(ct);
        return ToDto(landingPageId, seo);
    }

    public static SeoDto ToDto(int landingPageId, SeoSetting? seo) => new(
        landingPageId, seo?.MetaTitle, seo?.MetaDescription, seo?.Keywords, seo?.OgImage, seo?.CanonicalUrl);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task EnsurePageExistsAsync(int landingPageId, CancellationToken ct)
    {
        if (!await db.LandingPages.AnyAsync(p => p.Id == landingPageId, ct))
            throw AppException.NotFound("Không tìm thấy landing page.");
    }
}
