using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public sealed class LoginRequest
{
    [Required, StringLength(50)]
    public string Username { get; set; } = "";

    [Required, StringLength(100)]
    public string Password { get; set; } = "";
}

public sealed class ChangePasswordRequest
{
    [Required, StringLength(100)]
    public string CurrentPassword { get; set; } = "";

    [Required, StringLength(100, MinimumLength = 8)]
    public string NewPassword { get; set; } = "";
}

public sealed record UserDto(int Id, string Username, string Role);

public sealed record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);
