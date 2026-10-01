using System.Text;
using CmsApi.Data;
using CmsApi.Entities;
using CmsApi.Options;
using CmsApi.Services;
using CmsApi.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Tests;

internal static class TestSupport
{
    /// <summary>A fresh in-memory SQLite database (a real relational provider, so ExecuteUpdate etc. work).</summary>
    public static AppDbContext CreateDb()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        db.Database.EnsureCreated();
        return db;
    }

    public static IPasswordHasher<User> Hasher { get; } = new PasswordHasher<User>();

    public static JwtOptions Jwt(string secret = "unit-test-secret-that-is-at-least-32-characters") =>
        new() { Secret = secret, Issuer = "tests", Audience = "tests-admin", ExpiryMinutes = 30 };

    public static TokenService Tokens(string? secret = null) =>
        new(Microsoft.Extensions.Options.Options.Create(secret is null ? Jwt() : Jwt(secret)));

    public static async Task<LandingPage> AddPageAsync(AppDbContext db, string slug = "home")
    {
        var page = new LandingPage { Name = slug, Slug = slug, Title = slug };
        db.LandingPages.Add(page);
        await db.SaveChangesAsync();
        return page;
    }

    public static IFormFile File(string name, byte[] content, string contentType)
    {
        var stream = new MemoryStream(content);
        return new FormFile(stream, 0, content.Length, "file", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    public static IFormFile TextFile(string name, string content, string contentType) =>
        File(name, Encoding.UTF8.GetBytes(content), contentType);

    public static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];
}

internal sealed class FakeFileStorage : IFileStorage
{
    public List<string> Saved { get; } = [];
    public List<string> Deleted { get; } = [];

    public Task<string> SaveAsync(string relativePath, Stream content, CancellationToken ct)
    {
        Saved.Add(relativePath);
        return Task.FromResult($"/uploads/{relativePath}");
    }

    public Task DeleteAsync(string fileUrl, CancellationToken ct)
    {
        Deleted.Add(fileUrl);
        return Task.CompletedTask;
    }
}
