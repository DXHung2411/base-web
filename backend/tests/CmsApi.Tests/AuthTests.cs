using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Entities;
using CmsApi.Services;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Tests;

public class AuthTests
{
    private static async Task<(CmsApi.Data.AppDbContext Db, AuthService Auth, User User)> CreateAsync()
    {
        var db = TestSupport.CreateDb();
        var admin = new Role { Name = RoleNames.Admin };
        var user = new User { Username = "admin", Role = admin };
        user.PasswordHash = TestSupport.Hasher.HashPassword(user, "Correct-horse-1");
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return (db, new AuthService(db, TestSupport.Hasher, TestSupport.Tokens()), user);
    }

    [Fact]
    public async Task Login_returns_a_token_and_never_the_password()
    {
        var (db, auth, _) = await CreateAsync();
        await using var _db = db;

        var result = await auth.LoginAsync(new LoginRequest { Username = "admin", Password = "Correct-horse-1" }, default);

        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.Equal("Admin", result.User.Role);
        Assert.DoesNotContain("Correct-horse-1", System.Text.Json.JsonSerializer.Serialize(result));
    }

    [Theory]
    [InlineData("admin", "wrong")]
    [InlineData("nobody", "Correct-horse-1")]
    public async Task Login_fails_with_the_same_message_for_bad_user_or_password(string username, string password)
    {
        var (db, auth, _) = await CreateAsync();
        await using var _db = db;

        var error = await Assert.ThrowsAsync<AppException>(() => auth.LoginAsync(new LoginRequest { Username = username, Password = password }, default));

        Assert.Equal(401, error.StatusCode);
        Assert.Equal("Tên đăng nhập hoặc mật khẩu không đúng.", error.Message);
    }

    [Fact]
    public async Task Passwords_are_stored_hashed()
    {
        var (db, _, user) = await CreateAsync();
        await using var _db = db;
        Assert.DoesNotContain("Correct-horse-1", (await db.Users.SingleAsync()).PasswordHash);
        Assert.NotEqual("Correct-horse-1", user.PasswordHash);
    }

    [Fact]
    public async Task Change_password_requires_the_current_password()
    {
        var (db, auth, user) = await CreateAsync();
        await using var _db = db;

        await Assert.ThrowsAsync<AppException>(() =>
            auth.ChangePasswordAsync(user.Id, new ChangePasswordRequest { CurrentPassword = "nope", NewPassword = "Another-pass-2" }, default));

        await auth.ChangePasswordAsync(user.Id, new ChangePasswordRequest { CurrentPassword = "Correct-horse-1", NewPassword = "Another-pass-2" }, default);
        await auth.LoginAsync(new LoginRequest { Username = "admin", Password = "Another-pass-2" }, default);
    }

    [Fact]
    public async Task The_last_admin_cannot_be_deleted_or_demoted()
    {
        var (db, _, user) = await CreateAsync();
        await using var _db = db;
        db.Roles.Add(new Role { Name = RoleNames.Editor });
        await db.SaveChangesAsync();
        var users = new UserService(db, TestSupport.Hasher);

        await Assert.ThrowsAsync<AppException>(() => users.DeleteAsync(user.Id, currentUserId: 999, default));
        await Assert.ThrowsAsync<AppException>(() => users.UpdateAsync(user.Id, new UpdateUserRequest { Role = RoleNames.Editor }, default));
    }

    [Fact]
    public async Task Users_cannot_delete_themselves()
    {
        var (db, _, user) = await CreateAsync();
        await using var _db = db;
        var users = new UserService(db, TestSupport.Hasher);
        var error = await Assert.ThrowsAsync<AppException>(() => users.DeleteAsync(user.Id, currentUserId: user.Id, default));
        Assert.Equal(400, error.StatusCode);
    }
}

public class PreviewTokenTests
{
    [Fact]
    public async Task A_preview_token_only_works_for_its_own_page()
    {
        var tokens = TestSupport.Tokens();
        var token = tokens.CreatePreviewToken(7);

        Assert.True(await tokens.IsValidPreviewTokenAsync(token, 7));
        Assert.False(await tokens.IsValidPreviewTokenAsync(token, 8));
    }

    [Fact]
    public async Task Garbage_or_foreign_tokens_are_rejected()
    {
        var tokens = TestSupport.Tokens();
        var foreign = TestSupport.Tokens("a-different-secret-that-is-also-32-chars-long").CreatePreviewToken(7);

        Assert.False(await tokens.IsValidPreviewTokenAsync("not-a-token", 7));
        Assert.False(await tokens.IsValidPreviewTokenAsync(foreign, 7));
    }

    [Fact]
    public async Task An_admin_login_token_is_not_a_preview_token()
    {
        var tokens = TestSupport.Tokens();
        var user = new User { Id = 1, Username = "admin", Role = new Role { Name = RoleNames.Admin } };
        var (login, _) = tokens.Create(user);

        Assert.False(await tokens.IsValidPreviewTokenAsync(login, 1));
    }
}
