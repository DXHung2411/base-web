using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Public;

[ApiController]
[Route("api/public")]
public sealed class PublicController(PublicService publicContent, SiteSettingService settings, TokenService tokens) : ControllerBase
{
    [HttpGet("landing-pages")]
    public async Task<ApiResponse<List<PublicPageSummaryDto>>> ListPages(CancellationToken ct) =>
        ApiResponse.Ok(await publicContent.ListPublishedPagesAsync(ct));

    [HttpGet("landing-pages/{slug}")]
    public async Task<ApiResponse<PublicPageDto>> GetPage(string slug, CancellationToken ct) =>
        ApiResponse.Ok(await publicContent.GetPublishedPageAsync(slug, ct));

    /// <summary>Renders any page (published or not) for the admin preview. Requires a token from the admin API.</summary>
    [HttpGet("preview/{id:int}")]
    public async Task<ApiResponse<PublicPageDto>> GetPreview(int id, [FromQuery] string? token, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(token) || !await tokens.IsValidPreviewTokenAsync(token, id))
            throw AppException.Unauthorized("Liên kết xem trước không hợp lệ hoặc đã hết hạn.");

        Response.Headers.CacheControl = "no-store";
        return ApiResponse.Ok(await publicContent.GetPageForPreviewAsync(id, ct));
    }

    [HttpGet("settings")]
    public async Task<ApiResponse<Dictionary<string, string>>> GetSettings(CancellationToken ct) =>
        ApiResponse.Ok(await settings.GetAllAsDictionaryAsync(ct));
}
