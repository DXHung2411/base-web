using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public sealed class AuthService(AppDbContext db, IPasswordHasher<User> hasher, TokenService tokens)
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await db.Users.Include(x => x.Role).FirstOrDefaultAsync(x => x.Username == request.Username, ct);
        var verification = user is null
            ? PasswordVerificationResult.Failed
            : hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (user is null || verification == PasswordVerificationResult.Failed)
            throw AppException.Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = hasher.HashPassword(user, request.Password);
            await db.SaveChangesAsync(ct);
        }

        var (token, expiresAt) = tokens.Create(user);
        return new LoginResponse(token, expiresAt, new UserDto(user.Id, user.Username, user.Role.Name));
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct)
    {
        var user = await db.Users.Include(x => x.Role).FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw AppException.Unauthorized("Tài khoản không còn tồn tại.");
        return new UserDto(user.Id, user.Username, user.Role.Name);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw AppException.Unauthorized("Tài khoản không còn tồn tại.");

        if (hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
            throw AppException.BadRequest("Mật khẩu hiện tại không đúng.");

        user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
        await db.SaveChangesAsync(ct);
    }
}
