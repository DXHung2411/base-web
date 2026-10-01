using CmsApi.Common;
using CmsApi.Dtos;
using CmsApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[Route("api/admin/users")]
[Authorize(Policy = "AdminOnly")]
public sealed class UsersController(UserService users) : AdminControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<List<UserDto>>> List(CancellationToken ct) =>
        ApiResponse.Ok(await users.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create(CreateUserRequest request, CancellationToken ct) =>
        CreatedData(await users.CreateAsync(request, ct));

    [HttpPut("{id:int}")]
    public async Task<ApiResponse<UserDto>> Update(int id, UpdateUserRequest request, CancellationToken ct) =>
        ApiResponse.Ok(await users.UpdateAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<ApiResponse<object?>> Delete(int id, CancellationToken ct)
    {
        await users.DeleteAsync(id, User.GetUserId(), ct);
        return ApiResponse.Ok();
    }
}
