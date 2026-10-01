using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/seo")]
public sealed class SeoController(SeoService seo) : AdminControllerBase
{
    [HttpGet("{landingPageId:int}")]
    public async Task<ApiResponse<SeoDto>> Get(int landingPageId, CancellationToken ct) =>
        ApiResponse.Ok(await seo.GetAsync(landingPageId, ct));

    [HttpPut("{landingPageId:int}")]
    public async Task<ApiResponse<SeoDto>> Update(int landingPageId, SeoRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await seo.UpsertAsync(landingPageId, request, ct));
}
