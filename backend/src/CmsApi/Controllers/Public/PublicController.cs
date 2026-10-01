using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Public;

[ApiController]
[Route("api/public")]
public sealed class PublicController(PublicService publicContent, SiteSettingService settings) : ControllerBase
{
    [HttpGet("landing-pages")]
    public async Task<ApiResponse<List<PublicPageSummaryDto>>> ListPages(CancellationToken ct) =>
        ApiResponse.Ok(await publicContent.ListPublishedPagesAsync(ct));

    [HttpGet("landing-pages/{slug}")]
    public async Task<ApiResponse<PublicPageDto>> GetPage(string slug, CancellationToken ct) =>
        ApiResponse.Ok(await publicContent.GetPublishedPageAsync(slug, ct));

    [HttpGet("settings")]
    public async Task<ApiResponse<Dictionary<string, string>>> GetSettings(CancellationToken ct) =>
        ApiResponse.Ok(await settings.GetAllAsDictionaryAsync(ct));
}
