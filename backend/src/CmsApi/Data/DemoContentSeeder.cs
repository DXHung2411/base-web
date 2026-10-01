using System.Text.Json;
using System.Text.Json.Nodes;
using CmsApi.Entities;
using CmsApi.Storage;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Data;

/// <summary>
/// Loads the sample landing page from Data/Seed/demo.json. Image values written as "@file.svg" are
/// uploaded from Data/Seed/images and replaced by their public URL.
/// </summary>
public sealed class DemoContentSeeder(AppDbContext db, IFileStorage storage, ILogger<DemoContentSeeder> logger)
{
    private static readonly string SeedRoot = Path.Combine(AppContext.BaseDirectory, "Data", "Seed");

    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (await db.LandingPages.AnyAsync(ct) || await db.SiteSettings.AnyAsync(ct)) return;

        var demo = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(SeedRoot, "demo.json"), ct))!;
        var imageUrls = await UploadImagesAsync(ct);

        foreach (var (key, value) in demo["settings"]!.AsObject())
            db.SiteSettings.Add(new SiteSetting { Key = key, Value = value!.GetValue<string>() });

        var pageNode = demo["page"]!;
        var seoNode = demo["seo"]!;
        var page = new LandingPage
        {
            Name = pageNode["name"]!.GetValue<string>(),
            Slug = pageNode["slug"]!.GetValue<string>(),
            Title = pageNode["title"]!.GetValue<string>(),
            Description = pageNode["description"]?.GetValue<string>(),
            IsPublished = true,
            Seo = new SeoSetting
            {
                MetaTitle = seoNode["metaTitle"]?.GetValue<string>(),
                MetaDescription = seoNode["metaDescription"]?.GetValue<string>(),
                Keywords = seoNode["keywords"]?.GetValue<string>(),
            }
        };

        var order = 0;
        foreach (var item in demo["menu"]!.AsArray())
        {
            page.MenuItems.Add(new MenuItem
            {
                Title = item!["title"]!.GetValue<string>(),
                Url = item["url"]!.GetValue<string>(),
                SortOrder = order++
            });
        }

        order = 0;
        foreach (var node in demo["sections"]!.AsArray())
        {
            var settingsJson = ReplaceImageTokens(node!["settings"]!.ToJsonString(), imageUrls);
            page.Sections.Add(new LandingSection
            {
                SectionType = node["sectionType"]!.GetValue<string>(),
                Title = node["title"]?.GetValue<string>(),
                Subtitle = node["subtitle"]?.GetValue<string>(),
                Content = node["content"]?.GetValue<string>(),
                SettingsJson = settingsJson,
                SortOrder = order++
            });
        }

        db.LandingPages.Add(page);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded demo landing page '{Slug}' with {Count} sections.", page.Slug, page.Sections.Count);
    }

    private async Task<Dictionary<string, string>> UploadImagesAsync(CancellationToken ct)
    {
        var urls = new Dictionary<string, string>();
        foreach (var path in Directory.EnumerateFiles(Path.Combine(SeedRoot, "images")))
        {
            var fileName = Path.GetFileName(path);
            await using var stream = File.OpenRead(path);
            var url = await storage.SaveAsync($"demo/{fileName}", stream, ct);
            urls[fileName] = url;

            db.Media.Add(new Media
            {
                FileName = fileName,
                FileUrl = url,
                AltText = Path.GetFileNameWithoutExtension(fileName).Replace('-', ' '),
                MimeType = "image/svg+xml",
                SizeBytes = new FileInfo(path).Length
            });
        }
        return urls;
    }

    private static string ReplaceImageTokens(string json, Dictionary<string, string> urls)
    {
        foreach (var (fileName, url) in urls)
            json = json.Replace($"\"@{fileName}\"", JsonSerializer.Serialize(url));
        return json;
    }
}
