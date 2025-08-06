namespace PhotoSorter.API.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Pattern { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int PhotoCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Pattern { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class UpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Pattern { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class ReorderCategoriesDto
{
    public List&lt;CategoryOrderDto&gt; Categories { get; set; } = new();
}

public class CategoryOrderDto
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
}