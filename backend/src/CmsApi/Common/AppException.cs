namespace CmsApi.Common;

/// <summary>Expected failure that maps to an HTTP status code and a user-facing message.</summary>
public sealed class AppException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    public static AppException BadRequest(string message) => new(StatusCodes.Status400BadRequest, message);

    public static AppException Unauthorized(string message) => new(StatusCodes.Status401Unauthorized, message);

    public static AppException NotFound(string message) => new(StatusCodes.Status404NotFound, message);

    public static AppException Conflict(string message) => new(StatusCodes.Status409Conflict, message);
}
