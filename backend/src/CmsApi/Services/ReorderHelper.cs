using CmsApi.Common;
using CmsApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Services;

public static class ReorderHelper
{
    /// <summary>Assigns SortOrder by position in <paramref name="orderedIds"/>. Caller saves changes.</summary>
    public static async Task ApplyAsync<T>(IQueryable<T> scope, IReadOnlyList<int> orderedIds, CancellationToken ct)
        where T : class, ISortable
    {
        var items = await scope.ToListAsync(ct);
        var sameSet = orderedIds.Distinct().Count() == orderedIds.Count
            && items.Count == orderedIds.Count
            && items.All(item => orderedIds.Contains(item.Id));
        if (!sameSet) throw AppException.BadRequest("Danh sách thứ tự không khớp với dữ liệu hiện có.");

        var position = orderedIds.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);
        foreach (var item in items) item.SortOrder = position[item.Id];
    }
}
