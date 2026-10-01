using CmsApi.Common;
using CmsApi.Options;
using CmsApi.Services;
using Microsoft.Extensions.Options;

namespace CmsApi.Tests;

public class MediaServiceTests
{
    private static (MediaService Service, FakeFileStorage Storage, CmsApi.Data.AppDbContext Db) Create(int maxMb = 5)
    {
        var db = TestSupport.CreateDb();
        var storage = new FakeFileStorage();
        var options = Microsoft.Extensions.Options.Options.Create(new StorageOptions { MaxFileSizeMb = maxMb });
        return (new MediaService(db, storage, options), storage, db);
    }

    [Fact]
    public async Task Accepts_a_real_png_and_stores_a_slugified_unique_name()
    {
        var (service, storage, db) = Create();
        await using var _ = db;

        var media = await service.UploadAsync(TestSupport.File("Ảnh Sảnh Tiệc.PNG", TestSupport.PngHeader, "image/png"), " alt ", default);

        Assert.Equal("image/png", media.MimeType);
        Assert.Equal("alt", media.AltText);
        Assert.Matches(@"^/uploads/\d{4}/\d{2}/anh-sanh-tiec-[0-9a-f]{8}\.png$", media.FileUrl);
        Assert.Single(storage.Saved);
    }

    [Theory]
    [InlineData("photo.gif", "image/gif")]
    [InlineData("script.php", "image/png")]
    [InlineData("noextension", "image/png")]
    public async Task Rejects_unsupported_extensions(string fileName, string mime)
    {
        var (service, _, db) = Create();
        await using var _db = db;
        await Assert.ThrowsAsync<AppException>(() => service.UploadAsync(TestSupport.File(fileName, TestSupport.PngHeader, mime), null, default));
    }

    [Fact]
    public async Task Rejects_mime_that_does_not_match_the_extension()
    {
        var (service, _, db) = Create();
        await using var _db = db;
        await Assert.ThrowsAsync<AppException>(() => service.UploadAsync(TestSupport.File("a.png", TestSupport.PngHeader, "image/jpeg"), null, default));
    }

    [Fact]
    public async Task Rejects_a_text_file_renamed_to_png()
    {
        var (service, storage, db) = Create();
        await using var _db = db;
        await Assert.ThrowsAsync<AppException>(() => service.UploadAsync(TestSupport.TextFile("a.png", "just text, not an image", "image/png"), null, default));
        Assert.Empty(storage.Saved);
    }

    [Fact]
    public async Task Rejects_empty_and_oversized_files()
    {
        var (service, _, db) = Create(maxMb: 1);
        await using var _db = db;
        await Assert.ThrowsAsync<AppException>(() => service.UploadAsync(TestSupport.File("a.png", [], "image/png"), null, default));

        var big = new byte[1024 * 1024 + 1];
        TestSupport.PngHeader.CopyTo(big, 0);
        await Assert.ThrowsAsync<AppException>(() => service.UploadAsync(TestSupport.File("big.png", big, "image/png"), null, default));
    }

    [Theory]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><a href='javascript:alert(1)'/></svg>")]
    [InlineData("<html>not an svg</html>")]
    public async Task Rejects_unsafe_or_fake_svg(string svg)
    {
        var (service, _, db) = Create();
        await using var _db = db;
        await Assert.ThrowsAsync<AppException>(() => service.UploadAsync(TestSupport.TextFile("a.svg", svg, "image/svg+xml"), null, default));
    }

    [Fact]
    public async Task Accepts_a_plain_svg_and_deletes_the_stored_file_with_the_record()
    {
        var (service, storage, db) = Create();
        await using var _db = db;
        var media = await service.UploadAsync(TestSupport.TextFile("logo.svg", "<svg xmlns='http://www.w3.org/2000/svg'><rect/></svg>", "image/svg+xml"), null, default);

        await service.DeleteAsync(media.Id, default);

        Assert.Equal([media.FileUrl], storage.Deleted);
        Assert.Empty(db.Media);
    }
}
