using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Entities;
using CmsApi.Services;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Tests;

public class ReorderTests
{
    private static SectionRequest Request(string type = "hero") => new() { SectionType = type, Title = type };

    [Fact]
    public async Task New_sections_are_appended_in_order()
    {
        await using var db = TestSupport.CreateDb();
        var page = await TestSupport.AddPageAsync(db);
        var sections = new SectionService(db);

        var first = await sections.CreateAsync(page.Id, Request("hero"), default);
        var second = await sections.CreateAsync(page.Id, Request("about"), default);

        Assert.Equal(0, first.SortOrder);
        Assert.Equal(1, second.SortOrder);
    }

    [Fact]
    public async Task Reorder_persists_the_new_order()
    {
        await using var db = TestSupport.CreateDb();
        var page = await TestSupport.AddPageAsync(db);
        var sections = new SectionService(db);
        var a = await sections.CreateAsync(page.Id, Request("hero"), default);
        var b = await sections.CreateAsync(page.Id, Request("about"), default);
        var c = await sections.CreateAsync(page.Id, Request("faq"), default);

        await sections.ReorderAsync(new ReorderRequest { LandingPageId = page.Id, OrderedIds = [c.Id, a.Id, b.Id] }, default);

        var ordered = await db.LandingSections.OrderBy(s => s.SortOrder).Select(s => s.Id).ToListAsync();
        Assert.Equal([c.Id, a.Id, b.Id], ordered);
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("duplicate")]
    [InlineData("foreign")]
    public async Task Reorder_rejects_lists_that_do_not_match_the_page(string problem)
    {
        await using var db = TestSupport.CreateDb();
        var page = await TestSupport.AddPageAsync(db, "one");
        var other = await TestSupport.AddPageAsync(db, "two");
        var sections = new SectionService(db);
        var a = await sections.CreateAsync(page.Id, Request("hero"), default);
        var b = await sections.CreateAsync(page.Id, Request("about"), default);
        var foreign = await sections.CreateAsync(other.Id, Request("faq"), default);

        List<int> ids = problem switch
        {
            "missing" => [a.Id],
            "duplicate" => [a.Id, a.Id],
            _ => [a.Id, foreign.Id],
        };

        var error = await Assert.ThrowsAsync<AppException>(() =>
            sections.ReorderAsync(new ReorderRequest { LandingPageId = page.Id, OrderedIds = ids }, default));
        Assert.Equal(400, error.StatusCode);
        Assert.NotNull(b);
    }

    [Fact]
    public async Task Unknown_section_type_and_non_object_settings_are_rejected()
    {
        await using var db = TestSupport.CreateDb();
        var page = await TestSupport.AddPageAsync(db);
        var sections = new SectionService(db);

        await Assert.ThrowsAsync<AppException>(() => sections.CreateAsync(page.Id, Request("carousel"), default));

        using var array = System.Text.Json.JsonDocument.Parse("[1,2]");
        var bad = Request();
        bad.Settings = array.RootElement.Clone();
        await Assert.ThrowsAsync<AppException>(() => sections.CreateAsync(page.Id, bad, default));
    }

    [Fact]
    public void Every_section_type_the_backend_accepts_has_a_name()
    {
        Assert.All(SectionTypes.All, type => Assert.Matches("^[a-z]+$", type));
    }
}
