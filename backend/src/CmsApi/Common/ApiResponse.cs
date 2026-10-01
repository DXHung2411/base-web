namespace CmsApi.Common;

/// <summary>Envelope for every successful response: { success: true, data, message? }.</summary>
public sealed record ApiResponse<T>(bool Success, T? Data, string? Message = null);

public static class ApiResponse
{
    public static ApiResponse<T> Ok<T>(T data, string? message = null) => new(true, data, message);

    public static ApiResponse<object?> Ok(string? message = null) => new(true, null, message);
}

/// <summary>Envelope for every failed response: { success: false, message, errors? }.</summary>
public sealed record ApiError(string Message, IDictionary<string, string[]>? Errors = null)
{
    public bool Success => false;
}
