using CmsApi.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CmsApi.Controllers.Admin;

[ApiController]
[Authorize]
public abstract class AdminControllerBase : ControllerBase
{
    /// <summary>201 response in the standard envelope.</summary>
    protected ObjectResult CreatedData<T>(T data) => StatusCode(StatusCodes.Status201Created, ApiResponse.Ok(data));
}
