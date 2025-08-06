using Microsoft.EntityFrameworkCore;
using PhotoSorter.API.Data;
using PhotoSorter.API.DTOs;
using PhotoSorter.API.Models;

namespace PhotoSorter.API.Services;

public class CategoryService : ICategoryService
{
    private readonly PhotoSorterContext _context;

    public CategoryService(PhotoSorterContext context)
    {
        _context = context;
    }

    public async Task&lt;IEnumerable&lt;CategoryDto&gt;&gt; GetAllCategoriesAsync()
    {
        var categories = await _context.Categories
            .Include(c =&gt; c.Photos)
            .OrderBy(c =&gt; c.SortOrder)
            .ThenBy(c =&gt; c.Name)
            .ToListAsync();

        return categories.Select(MapToDto);
    }

    public async Task&lt;CategoryDto?&gt; GetCategoryByIdAsync(int id)
    {
        var category = await _context.Categories
            .Include(c =&gt; c.Photos)
            .FirstOrDefaultAsync(c =&gt; c.Id == id);

        return category == null ? null : MapToDto(category);
    }

    public async Task&lt;CategoryDto&gt; CreateCategoryAsync(CreateCategoryDto createCategoryDto)
    {
        var maxSortOrder = await _context.Categories.MaxAsync(c =&gt; (int?)c.SortOrder) ?? 0;
        
        var category = new Category
        {
            Name = createCategoryDto.Name.Trim(),
            Path = string.IsNullOrEmpty(createCategoryDto.Path) 
                ? $"{createCategoryDto.Name.Trim()}/" 
                : createCategoryDto.Path,
            Pattern = createCategoryDto.Pattern,
            SortOrder = createCategoryDto.SortOrder == 0 ? maxSortOrder + 1 : createCategoryDto.SortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return MapToDto(category);
    }

    public async Task&lt;CategoryDto?&gt; UpdateCategoryAsync(int id, UpdateCategoryDto updateCategoryDto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return null;

        category.Name = updateCategoryDto.Name.Trim();
        category.Path = string.IsNullOrEmpty(updateCategoryDto.Path) 
            ? $"{updateCategoryDto.Name.Trim()}/" 
            : updateCategoryDto.Path;
        category.Pattern = updateCategoryDto.Pattern;
        category.SortOrder = updateCategoryDto.SortOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        // Reload with photos for accurate count
        await _context.Entry(category).Collection(c =&gt; c.Photos).LoadAsync();
        
        return MapToDto(category);
    }

    public async Task&lt;bool&gt; DeleteCategoryAsync(int id)
    {
        var category = await _context.Categories
            .Include(c =&gt; c.Photos)
            .FirstOrDefaultAsync(c =&gt; c.Id == id);
            
        if (category == null) return false;

        // Move photos to "Unsorted" category
        var unsortedCategory = await _context.Categories
            .FirstOrDefaultAsync(c =&gt; c.Name == "Unsorted");
            
        if (unsortedCategory != null)
        {
            foreach (var photo in category.Photos)
            {
                photo.CategoryId = unsortedCategory.Id;
            }
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task&lt;bool&gt; ReorderCategoriesAsync(ReorderCategoriesDto reorderDto)
    {
        foreach (var categoryOrder in reorderDto.Categories)
        {
            var category = await _context.Categories.FindAsync(categoryOrder.Id);
            if (category != null)
            {
                category.SortOrder = categoryOrder.SortOrder;
                category.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task&lt;int?&gt; SuggestCategoryAsync(string fileName)
    {
        var categories = await _context.Categories.ToListAsync();
        var lowerFileName = fileName.ToLowerInvariant();

        // Simple pattern matching logic
        foreach (var category in categories.OrderBy(c =&gt; c.SortOrder))
        {
            if (category.Name == "Unsorted") continue;

            var patterns = ExtractPatterns(category.Pattern);
            if (patterns.Any(pattern =&gt; lowerFileName.Contains(pattern.ToLowerInvariant())))
            {
                return category.Id;
            }
        }

        // Return Unsorted category if no match
        var unsorted = categories.FirstOrDefault(c =&gt; c.Name == "Unsorted");
        return unsorted?.Id;
    }

    private static List&lt;string&gt; ExtractPatterns(string patternString)
    {
        if (string.IsNullOrEmpty(patternString)) return new List&lt;string&gt;();

        // Extract patterns from format like "contains: word1, word2, word3"
        var containsIndex = patternString.IndexOf("contains:", StringComparison.OrdinalIgnoreCase);
        if (containsIndex == -1) return new List&lt;string&gt;();

        var patternsText = patternString.Substring(containsIndex + 9);
        return patternsText.Split(',', StringSplitOptions.RemoveEmptyEntries)
                          .Select(p =&gt; p.Trim())
                          .ToList();
    }

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Path = category.Path,
            Pattern = category.Pattern,
            SortOrder = category.SortOrder,
            PhotoCount = category.Photos?.Count ?? 0,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }
}