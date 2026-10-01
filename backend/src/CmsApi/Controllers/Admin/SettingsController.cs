using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/settings")]
public sealed class SettingsController(SiteSettingService settings) : AdminControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<List<SiteSettingDto>>> List(CancellationToken ct) =>
        ApiResponse.Ok(await settings.ListAsync(ct));

    [HttpPut]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ApiResponse<object?>> UpdateMany(UpdateSettingsRequest request, CancellationToken ct)
    {
        await settings.UpsertAsync(request.Values, ct);
        return ApiResponse.Ok();
    }

    [HttpPut("{key}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ApiResponse<object?>> Update(string key, SettingValueRequest request, CancellationToken ct)
    {
        await settings.UpsertAsync(new Dictionary<string, string> { [key] = request.Value }, ct);
        return ApiResponse.Ok();
    }
}
