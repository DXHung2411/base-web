using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/sections")]
public sealed class SectionsController(SectionService sections) : AdminControllerBase
{
    [HttpPut("reorder")]
    public async Task<ApiResponse<object?>> Reorder(ReorderRequest request, CancellationToken ct)
    {
        await sections.ReorderAsync(request, ct);
        return ApiResponse.Ok();
    }

    [HttpPut("{id:int}")]
    public async Task<ApiResponse<SectionDto>> Update(int id, SectionRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await sections.UpdateAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<ApiResponse<object?>> Delete(int id, CancellationToken ct)
    {
        await sections.DeleteAsync(id, ct);
        return ApiResponse.Ok();
    }
}
