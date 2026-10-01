using System.Security.Claims;

namespace CmsApi.Common;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal principal) =>
        int.Parse(principal.FindFirstValue("sub") ?? throw AppException.Unauthorized("Token không hợp lệ."));
}
