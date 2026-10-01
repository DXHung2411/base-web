using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ApiResponse<LoginResponse>> Login(LoginRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await auth.LoginAsync(request, ct));

    [HttpGet("me")]
    [Authorize]
    public async Task<ApiResponse<UserDto>> Me(CancellationToken ct) =>
        ApiResponse.Ok(await auth.GetCurrentUserAsync(User.GetUserId(), ct));

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ApiResponse<object?>> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        await auth.ChangePasswordAsync(User.GetUserId(), request, ct);
        return ApiResponse.Ok("Đã đổi mật khẩu.");
    }
}
