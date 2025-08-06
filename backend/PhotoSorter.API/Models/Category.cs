using System.ComponentModel.DataAnnotations;

namespace PhotoSorter.API.Models;

public class Category
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(200)]
    public string Path { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Pattern { get; set; } = string.Empty;
    
    public int SortOrder { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public ICollection&lt;Photo&gt; Photos { get; set; } = new List&lt;Photo&gt;();
    
    // Computed property
    public int PhotoCount =&gt; Photos?.Count ?? 0;
}