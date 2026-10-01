using Microsoft.AspNetCore.Diagnostics;

namespace CmsApi.Common;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is AppException appException)
        {
            context.Response.StatusCode = appException.StatusCode;
            await context.Response.WriteAsJsonAsync(new ApiError(appException.Message), cancellationToken);
            return true;
        }

        logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

        // Never leak stack traces; only expose the message outside production.
        var message = environment.IsProduction() ? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." : exception.Message;
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new ApiError(message), cancellationToken);
        return true;
    }
}
