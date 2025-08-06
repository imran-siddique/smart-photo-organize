using Microsoft.AspNetCore.Mvc;
using PhotoSorter.API.DTOs;
using PhotoSorter.API.Services;

namespace PhotoSorter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;IEnumerable&lt;CategoryDto&gt;&gt;&gt; GetCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;CategoryDto&gt;&gt; GetCategory(int id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category == null)
            return NotFound();

        return Ok(category);
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;CategoryDto&gt;&gt; CreateCategory(CreateCategoryDto createCategoryDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var category = await _categoryService.CreateCategoryAsync(createCategoryDto);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task&lt;ActionResult&lt;CategoryDto&gt;&gt; UpdateCategory(int id, UpdateCategoryDto updateCategoryDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var category = await _categoryService.UpdateCategoryAsync(id, updateCategoryDto);
        if (category == null)
            return NotFound();

        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task&lt;ActionResult&gt; DeleteCategory(int id)
    {
        var result = await _categoryService.DeleteCategoryAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task&lt;ActionResult&gt; ReorderCategories(ReorderCategoriesDto reorderDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _categoryService.ReorderCategoriesAsync(reorderDto);
        if (!result)
            return BadRequest("Failed to reorder categories");

        return NoContent();
    }

    [HttpGet("suggest")]
    public async Task&lt;ActionResult&lt;int?&gt;&gt; SuggestCategory([FromQuery] string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
            return BadRequest("FileName is required");

        var categoryId = await _categoryService.SuggestCategoryAsync(fileName);
        return Ok(categoryId);
    }
}