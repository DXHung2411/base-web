using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<LandingPage> LandingPages => Set<LandingPage>();
    public DbSet<LandingSection> LandingSections => Set<LandingSection>();
    public DbSet<Media> Media => Set<Media>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<SeoSetting> SeoSettings => Set<SeoSetting>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(50);
            e.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<User>(e =>
        {
            e.Property(x => x.Username).HasMaxLength(50);
            e.Property(x => x.PasswordHash).HasMaxLength(500);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LandingPage>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Slug).HasMaxLength(100);
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Description).HasMaxLength(500);
            e.HasIndex(x => x.Slug).IsUnique();
        });

        modelBuilder.Entity<LandingSection>(e =>
        {
            e.Property(x => x.SectionType).HasMaxLength(50);
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Subtitle).HasMaxLength(500);
            e.Property(x => x.SettingsJson).HasDefaultValue("{}");
            e.HasIndex(x => new { x.LandingPageId, x.SortOrder });
            e.HasOne(x => x.LandingPage).WithMany(x => x.Sections).HasForeignKey(x => x.LandingPageId);
        });

        modelBuilder.Entity<Media>(e =>
        {
            e.Property(x => x.FileName).HasMaxLength(260);
            e.Property(x => x.FileUrl).HasMaxLength(500);
            e.Property(x => x.AltText).HasMaxLength(300);
            e.Property(x => x.MimeType).HasMaxLength(100);
            e.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<MenuItem>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(100);
            e.Property(x => x.Url).HasMaxLength(500);
            e.HasIndex(x => new { x.LandingPageId, x.SortOrder });
            e.HasOne(x => x.LandingPage).WithMany(x => x.MenuItems).HasForeignKey(x => x.LandingPageId);
        });

        modelBuilder.Entity<SeoSetting>(e =>
        {
            e.Property(x => x.MetaTitle).HasMaxLength(200);
            e.Property(x => x.MetaDescription).HasMaxLength(500);
            e.Property(x => x.Keywords).HasMaxLength(500);
            e.Property(x => x.OgImage).HasMaxLength(500);
            e.Property(x => x.CanonicalUrl).HasMaxLength(500);
            e.HasIndex(x => x.LandingPageId).IsUnique();
            e.HasOne(x => x.LandingPage).WithOne(x => x.Seo).HasForeignKey<SeoSetting>(x => x.LandingPageId);
        });

        modelBuilder.Entity<SiteSetting>(e =>
        {
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasMaxLength(100);
            e.Property(x => x.Description).HasMaxLength(300);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<ITimestamped>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
