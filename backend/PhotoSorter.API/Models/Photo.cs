using System.ComponentModel.DataAnnotations;

namespace PhotoSorter.API.Models;

public class Photo
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? ThumbnailPath { get; set; }
    
    public long Size { get; set; }
    
    [MaxLength(50)]
    public string ContentType { get; set; } = string.Empty;
    
    [MaxLength(64)]
    public string? FileHash { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastModified { get; set; }
    
    // Foreign key
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    
    // Duplicate detection
    public bool IsDuplicate { get; set; }
    public int? OriginalPhotoId { get; set; }
    public Photo? OriginalPhoto { get; set; }
    
    // Navigation property
    public ICollection&lt;Photo&gt; Duplicates { get; set; } = new List&lt;Photo&gt;();
}