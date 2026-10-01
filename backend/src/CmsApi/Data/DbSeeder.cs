using CmsApi.Entities;
using CmsApi.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CmsApi.Data;

public sealed class DbSeeder(
    AppDbContext db,
    IPasswordHasher<User> hasher,
    IOptions<SeedOptions> seedOptions,
    ILogger<DbSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedRolesAsync(ct);
        await SeedAdminAsync(ct);
    }

    private async Task SeedRolesAsync(CancellationToken ct)
    {
        foreach (var name in new[] { RoleNames.Admin, RoleNames.Editor })
        {
            if (!await db.Roles.AnyAsync(x => x.Name == name, ct))
                db.Roles.Add(new Role { Name = name });
        }
        await db.SaveChangesAsync(ct);
    }

    private async Task SeedAdminAsync(CancellationToken ct)
    {
        var options = seedOptions.Value;
        if (await db.Users.AnyAsync(ct)) return;

        if (string.IsNullOrWhiteSpace(options.AdminPassword))
        {
            logger.LogWarning("No users exist and Seed:AdminPassword is not set, so no admin account was created.");
            return;
        }

        var adminRole = await db.Roles.SingleAsync(x => x.Name == RoleNames.Admin, ct);
        var admin = new User { Username = options.AdminUsername, RoleId = adminRole.Id };
        admin.PasswordHash = hasher.HashPassword(admin, options.AdminPassword);
        db.Users.Add(admin);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Created admin account '{Username}'.", options.AdminUsername);
    }
}
