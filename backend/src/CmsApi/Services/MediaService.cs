using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using CmsApi.Options;
using CmsApi.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CmsApi.Services;

public sealed partial class MediaService(AppDbContext db, IFileStorage storage, IOptions<StorageOptions> options)
{
    private static readonly Dictionary<string, string> MimeByExtension = new()
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".svg"] = "image/svg+xml"
    };

    public async Task<PagedResult<MediaDto>> ListAsync(string? search, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Media.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(m => m.FileName.Contains(term) || (m.AltText != null && m.AltText.Contains(term)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MediaDto(m.Id, m.FileName, m.FileUrl, m.AltText, m.MimeType, m.SizeBytes, m.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<MediaDto>(items, total, page, pageSize);
    }

    public async Task<MediaDto> UploadAsync(IFormFile file, string? altText, CancellationToken ct)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        await ValidateAsync(file, extension, ct);

        var now = DateTime.UtcNow;
        var storedName = $"{Slugify(Path.GetFileNameWithoutExtension(file.FileName))}-{Guid.NewGuid().ToString("N")[..8]}{extension}";
        var relativePath = $"{now:yyyy}/{now:MM}/{storedName}";

        await using var stream = file.OpenReadStream();
        var url = await storage.SaveAsync(relativePath, stream, ct);

        var media = new Media
        {
            FileName = Path.GetFileName(file.FileName),
            FileUrl = url,
            AltText = string.IsNullOrWhiteSpace(altText) ? null : altText.Trim(),
            MimeType = MimeByExtension[extension],
            SizeBytes = file.Length
        };
        db.Media.Add(media);
        await db.SaveChangesAsync(ct);
        return ToDto(media);
    }

    public async Task<MediaDto> UpdateAsync(int id, MediaUpdateRequest request, CancellationToken ct)
    {
        var media = await db.Media.FindAsync([id], ct) ?? throw NotFound();
        media.AltText = string.IsNullOrWhiteSpace(request.AltText) ? null : request.AltText.Trim();
        await db.SaveChangesAsync(ct);
        return ToDto(media);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var media = await db.Media.FindAsync([id], ct) ?? throw NotFound();
        await storage.DeleteAsync(media.FileUrl, ct);
        db.Media.Remove(media);
        await db.SaveChangesAsync(ct);
    }

    private async Task ValidateAsync(IFormFile file, string extension, CancellationToken ct)
    {
        var maxBytes = options.Value.MaxFileSizeMb * 1024L * 1024L;
        if (file.Length == 0) throw AppException.BadRequest("Tệp tải lên đang trống.");
        if (file.Length > maxBytes) throw AppException.BadRequest($"Tệp vượt quá giới hạn {options.Value.MaxFileSizeMb} MB.");

        if (!MimeByExtension.TryGetValue(extension, out var expectedMime))
            throw AppException.BadRequest("Chỉ hỗ trợ các định dạng JPG, JPEG, PNG, WEBP và SVG.");
        if (!string.Equals(file.ContentType, expectedMime, StringComparison.OrdinalIgnoreCase))
            throw AppException.BadRequest("Loại MIME không khớp với phần mở rộng của tệp.");

        await using var stream = file.OpenReadStream();
        var header = new byte[12];
        var read = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, ct);
        if (!MatchesSignature(extension, header.AsSpan(0, read)))
            throw AppException.BadRequest("Nội dung tệp không phải là ảnh hợp lệ.");

        if (extension == ".svg")
        {
            stream.Position = 0;
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var text = await reader.ReadToEndAsync(ct);
            if (!text.Contains("<svg", StringComparison.OrdinalIgnoreCase) || UnsafeSvgPattern().IsMatch(text))
                throw AppException.BadRequest("SVG không hợp lệ hoặc chứa mã script.");
        }
    }

    private static bool MatchesSignature(string extension, ReadOnlySpan<byte> header) => extension switch
    {
        ".jpg" or ".jpeg" => header.StartsWith(new byte[] { 0xFF, 0xD8, 0xFF }),
        ".png" => header.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
        ".webp" => header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8),
        ".svg" => true,
        _ => false
    };

    private static string Slugify(string name)
    {
        var withoutAccents = name.ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark);
        var slug = NonSlugCharacters().Replace(new string(withoutAccents.ToArray()), "-").Trim('-');
        return slug.Length == 0 ? "image" : slug[..Math.Min(slug.Length, 40)];
    }

    private static MediaDto ToDto(Media m) => new(m.Id, m.FileName, m.FileUrl, m.AltText, m.MimeType, m.SizeBytes, m.CreatedAt);

    private static AppException NotFound() => AppException.NotFound("Không tìm thấy tệp.");

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugCharacters();

    [GeneratedRegex(@"<script|\son\w+\s*=|javascript:", RegexOptions.IgnoreCase)]
    private static partial Regex UnsafeSvgPattern();
}
