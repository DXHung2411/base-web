using System.Text.Json;
using CmsApi.Common;

namespace CmsApi.Services;

/// <summary>Converts section settings between the JSON column and API payloads.</summary>
public static class SectionSettings
{
    private const int MaxLength = 200_000;

    public static JsonElement Parse(string json) => JsonSerializer.Deserialize<JsonElement>(json);

    public static string ToJson(JsonElement? settings)
    {
        if (settings is null || settings.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined) return "{}";
        if (settings.Value.ValueKind != JsonValueKind.Object)
            throw AppException.BadRequest("Settings phải là một đối tượng JSON.");

        var json = settings.Value.GetRawText();
        if (json.Length > MaxLength) throw AppException.BadRequest("Settings quá lớn.");
        return json;
    }
}
