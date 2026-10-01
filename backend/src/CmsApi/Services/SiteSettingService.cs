using System.Text.RegularExpressions;
using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public static class SettingKeys
{
    public const string HomeSlug = "site.homeSlug";
}

public sealed partial class SiteSettingService(AppDbContext db)
{
    public async Task<List<SiteSettingDto>> ListAsync(CancellationToken ct) =>
        await db.SiteSettings.AsNoTracking().OrderBy(s => s.Key)
            .Select(s => new SiteSettingDto(s.Key, s.Value, s.Description))
            .ToListAsync(ct);

    public async Task<Dictionary<string, string>> GetAllAsDictionaryAsync(CancellationToken ct) =>
        await db.SiteSettings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value, ct);

    public async Task UpsertAsync(IReadOnlyDictionary<string, string> values, CancellationToken ct)
    {
        var invalidKey = values.Keys.FirstOrDefault(key => !KeyPattern().IsMatch(key));
        if (invalidKey is not null) throw AppException.BadRequest($"Khóa cài đặt '{invalidKey}' không hợp lệ.");

        var existing = await db.SiteSettings.Where(s => values.Keys.Contains(s.Key)).ToDictionaryAsync(s => s.Key, ct);
        foreach (var (key, value) in values)
        {
            if (existing.TryGetValue(key, out var setting)) setting.Value = value;
            else db.SiteSettings.Add(new SiteSetting { Key = key, Value = value });
        }
        await db.SaveChangesAsync(ct);
    }

    [GeneratedRegex("^[a-z][a-zA-Z0-9]*(\\.[a-zA-Z][a-zA-Z0-9]*)*$")]
    private static partial Regex KeyPattern();
}
