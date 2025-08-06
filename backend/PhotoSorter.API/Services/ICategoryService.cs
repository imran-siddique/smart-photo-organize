using PhotoSorter.API.DTOs;
using PhotoSorter.API.Models;

namespace PhotoSorter.API.Services;

public interface ICategoryService
{
    Task&lt;IEnumerable&lt;CategoryDto&gt;&gt; GetAllCategoriesAsync();
    Task&lt;CategoryDto?&gt; GetCategoryByIdAsync(int id);
    Task&lt;CategoryDto&gt; CreateCategoryAsync(CreateCategoryDto createCategoryDto);
    Task&lt;CategoryDto?&gt; UpdateCategoryAsync(int id, UpdateCategoryDto updateCategoryDto);
    Task&lt;bool&gt; DeleteCategoryAsync(int id);
    Task&lt;bool&gt; ReorderCategoriesAsync(ReorderCategoriesDto reorderDto);
    Task&lt;int?&gt; SuggestCategoryAsync(string fileName);
}