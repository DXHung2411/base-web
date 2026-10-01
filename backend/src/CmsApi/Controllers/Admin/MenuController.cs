using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/menu")]
public sealed class MenuController(MenuService menu) : AdminControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<List<MenuItemDto>>> List([FromQuery] int landingPageId, CancellationToken ct) =>
        ApiResponse.Ok(await menu.ListAsync(landingPageId, ct));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<MenuItemDto>>> Create(MenuItemCreateRequest request, CancellationToken ct) =>
        CreatedData(await menu.CreateAsync(request, ct));

    [HttpPut("reorder")]
    public async Task<ApiResponse<object?>> Reorder(ReorderRequest request, CancellationToken ct)
    {
        await menu.ReorderAsync(request, ct);
        return ApiResponse.Ok();
    }

    [HttpPut("{id:int}")]
    public async Task<ApiResponse<MenuItemDto>> Update(int id, MenuItemRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await menu.UpdateAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<ApiResponse<object?>> Delete(int id, CancellationToken ct)
    {
        await menu.DeleteAsync(id, ct);
        return ApiResponse.Ok();
    }
}
