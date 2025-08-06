namespace PhotoSorter.API.DTOs;

public class PhotoDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public long Size { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModified { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public bool IsDuplicate { get; set; }
    public int? OriginalPhotoId { get; set; }
}

public class CreatePhotoDto
{
    public string Name { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long Size { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime? LastModified { get; set; }
    public int? CategoryId { get; set; }
}

public class UpdatePhotoCategoryDto
{
    public int CategoryId { get; set; }
}