using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/media")]
public sealed class MediaController(MediaService media) : AdminControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<PagedResult<MediaDto>>> List(
        string? search, CancellationToken ct, int page = 1, int pageSize = 24) =>
        ApiResponse.Ok(await media.ListAsync(search, page, pageSize, ct));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<MediaDto>>> Upload(
        IFormFile file, [FromForm] string? altText, CancellationToken ct) =>
        CreatedData(await media.UploadAsync(file, altText, ct));

    [HttpPut("{id:int}")]
    public async Task<ApiResponse<MediaDto>> Update(int id, MediaUpdateRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await media.UpdateAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<ApiResponse<object?>> Delete(int id, CancellationToken ct)
    {
        await media.DeleteAsync(id, ct);
        return ApiResponse.Ok();
    }
}
