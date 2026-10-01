using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/landing-pages")]
public sealed class LandingPagesController(LandingPageService pages, SectionService sections) : AdminControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<PagedResult<LandingPageDto>>> List(
        string? search, bool? isPublished, CancellationToken ct, int page = 1, int pageSize = 20) =>
        ApiResponse.Ok(await pages.ListAsync(search, isPublished, page, pageSize, ct));

    [HttpGet("{id:int}")]
    public async Task<ApiResponse<LandingPageDto>> Get(int id, CancellationToken ct) =>
        ApiResponse.Ok(await pages.GetAsync(id, ct));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LandingPageDto>>> Create(LandingPageRequest request, CancellationToken ct) =>
        CreatedData(await pages.CreateAsync(request, ct));

    [HttpPut("{id:int}")]
    public async Task<ApiResponse<LandingPageDto>> Update(int id, LandingPageRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await pages.UpdateAsync(id, request, ct));

    [HttpPatch("{id:int}/publish")]
    public async Task<ApiResponse<LandingPageDto>> SetPublished(int id, PublishRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await pages.SetPublishedAsync(id, request.IsPublished, ct));

    [HttpDelete("{id:int}")]
    public async Task<ApiResponse<object?>> Delete(int id, CancellationToken ct)
    {
        await pages.DeleteAsync(id, ct);
        return ApiResponse.Ok();
    }

    [HttpGet("{id:int}/sections")]
    public async Task<ApiResponse<List<SectionDto>>> ListSections(int id, CancellationToken ct) =>
        ApiResponse.Ok(await sections.ListAsync(id, ct));

    [HttpPost("{id:int}/sections")]
    public async Task<ActionResult<ApiResponse<SectionDto>>> CreateSection(int id, SectionRequest request, CancellationToken ct) =>
        CreatedData(await sections.CreateAsync(id, request, ct));
}
