namespace CmsApi.Entities;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
}
