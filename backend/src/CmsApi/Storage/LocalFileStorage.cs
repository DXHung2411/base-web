using CmsApi.Options;
using Microsoft.Extensions.Options;

namespace CmsApi.Storage;

public sealed class LocalFileStorage(IOptions<StorageOptions> options, IHostEnvironment environment) : IFileStorage
{
    public const string RequestPath = "/uploads";

    private readonly string _root = ResolveRoot(options.Value, environment);

    public static string ResolveRoot(StorageOptions options, IHostEnvironment environment) =>
        Path.GetFullPath(options.UploadPath, environment.ContentRootPath);

    public async Task<string> SaveAsync(string relativePath, Stream content, CancellationToken ct)
    {
        var fullPath = ResolveInsideRoot(relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await using var target = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write);
        await content.CopyToAsync(target, ct);
        return $"{RequestPath}/{relativePath}";
    }

    public Task DeleteAsync(string fileUrl, CancellationToken ct)
    {
        if (!fileUrl.StartsWith(RequestPath + "/", StringComparison.Ordinal)) return Task.CompletedTask;

        var fullPath = ResolveInsideRoot(fileUrl[(RequestPath.Length + 1)..]);
        if (File.Exists(fullPath)) File.Delete(fullPath);
        return Task.CompletedTask;
    }

    private string ResolveInsideRoot(string relativePath)
    {
        var fullPath = Path.GetFullPath(relativePath, _root);
        if (!fullPath.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new InvalidOperationException("Path escapes the upload root.");
        return fullPath;
    }
}
