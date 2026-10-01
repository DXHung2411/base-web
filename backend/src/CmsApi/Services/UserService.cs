using CmsApi.Common;
using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public sealed class UserService(AppDbContext db, IPasswordHasher<User> hasher)
{
    public async Task<List<UserDto>> ListAsync(CancellationToken ct) =>
        await db.Users.AsNoTracking().OrderBy(u => u.Username)
            .Select(u => new UserDto(u.Id, u.Username, u.Role.Name))
            .ToListAsync(ct);

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(u => u.Username == request.Username, ct))
            throw AppException.Conflict("Tên đăng nhập đã tồn tại.");

        var role = await FindRoleAsync(request.Role, ct);
        var user = new User { Username = request.Username, RoleId = role.Id };
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return new UserDto(user.Id, user.Username, role.Name);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest request, CancellationToken ct)
    {
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw NotFound();
        var role = await FindRoleAsync(request.Role, ct);

        if (user.Role.Name == RoleNames.Admin && role.Name != RoleNames.Admin)
            await EnsureNotLastAdminAsync(ct);

        user.RoleId = role.Id;
        if (!string.IsNullOrEmpty(request.NewPassword))
            user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
        await db.SaveChangesAsync(ct);
        return new UserDto(user.Id, user.Username, role.Name);
    }

    public async Task DeleteAsync(int id, int currentUserId, CancellationToken ct)
    {
        if (id == currentUserId) throw AppException.BadRequest("Bạn không thể tự xóa tài khoản của mình.");
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw NotFound();
        if (user.Role.Name == RoleNames.Admin) await EnsureNotLastAdminAsync(ct);

        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);
    }

    private async Task<Role> FindRoleAsync(string name, CancellationToken ct) =>
        await db.Roles.FirstOrDefaultAsync(r => r.Name == name, ct)
        ?? throw AppException.BadRequest($"Vai trò '{name}' không tồn tại.");

    private async Task EnsureNotLastAdminAsync(CancellationToken ct)
    {
        if (await db.Users.CountAsync(u => u.Role.Name == RoleNames.Admin, ct) <= 1)
            throw AppException.BadRequest("Phải còn ít nhất một tài khoản Admin.");
    }

    private static AppException NotFound() => AppException.NotFound("Không tìm thấy người dùng.");
}
