namespace CmsApi.Storage;

/// <summary>Where uploaded files live. Swap the implementation to move to S3, Azure Blob or R2.</summary>
public interface IFileStorage
{
    /// <summary>Saves the stream at <paramref name="relativePath"/> (forward slashes) and returns its public URL.</summary>
    Task<string> SaveAsync(string relativePath, Stream content, CancellationToken ct);

    Task DeleteAsync(string fileUrl, CancellationToken ct);
}
