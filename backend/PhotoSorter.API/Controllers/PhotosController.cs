using Microsoft.AspNetCore.Mvc;
using PhotoSorter.API.DTOs;
using PhotoSorter.API.Services;

namespace PhotoSorter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PhotosController : ControllerBase
{
    private readonly IPhotoService _photoService;

    public PhotosController(IPhotoService photoService)
    {
        _photoService = photoService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;IEnumerable&lt;PhotoDto&gt;&gt;&gt; GetPhotos([FromQuery] int? categoryId = null)
    {
        var photos = categoryId.HasValue 
            ? await _photoService.GetPhotosByCategoryAsync(categoryId.Value)
            : await _photoService.GetAllPhotosAsync();

        return Ok(photos);
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;PhotoDto&gt;&gt; GetPhoto(int id)
    {
        var photo = await _photoService.GetPhotoByIdAsync(id);
        if (photo == null)
            return NotFound();

        return Ok(photo);
    }

    [HttpPost("upload")]
    public async Task&lt;ActionResult&lt;PhotoDto&gt;&gt; UploadPhoto([FromForm] CreatePhotoDto createPhotoDto, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        if (!IsImageFile(file))
            return BadRequest("Only image files are allowed");

        try
        {
            var photo = await _photoService.CreatePhotoAsync(createPhotoDto, file);
            return CreatedAtAction(nameof(GetPhoto), new { id = photo.Id }, photo);
        }
        catch (Exception ex)
        {
            return BadRequest($"Upload failed: {ex.Message}");
        }
    }

    [HttpPost("upload/multiple")]
    public async Task&lt;ActionResult&lt;IEnumerable&lt;PhotoDto&gt;&gt;&gt; UploadMultiplePhotos([FromForm] IFormFileCollection files)
    {
        if (files == null || files.Count == 0)
            return BadRequest("No files uploaded");

        var uploadedPhotos = new List&lt;PhotoDto&gt;();
        var errors = new List&lt;string&gt;();

        foreach (var file in files)
        {
            if (!IsImageFile(file))
            {
                errors.Add($"File {file.FileName} is not a valid image");
                continue;
            }

            try
            {
                var createDto = new CreatePhotoDto
                {
                    Name = Path.GetFileNameWithoutExtension(file.FileName),
                    FileName = file.FileName,
                    Size = file.Length,
                    ContentType = file.ContentType,
                    LastModified = DateTime.UtcNow
                };

                var photo = await _photoService.CreatePhotoAsync(createDto, file);
                uploadedPhotos.Add(photo);
            }
            catch (Exception ex)
            {
                errors.Add($"Failed to upload {file.FileName}: {ex.Message}");
            }
        }

        if (errors.Any() && !uploadedPhotos.Any())
            return BadRequest(new { Errors = errors });

        return Ok(new { Photos = uploadedPhotos, Errors = errors });
    }

    [HttpPut("{id}/category")]
    public async Task&lt;ActionResult&gt; UpdatePhotoCategory(int id, [FromBody] UpdatePhotoCategoryDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _photoService.UpdatePhotoCategoryAsync(id, updateDto.CategoryId);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPut("bulk/category")]
    public async Task&lt;ActionResult&gt; UpdateMultiplePhotosCategory([FromBody] BulkUpdateCategoryDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _photoService.UpdateMultiplePhotosCategoryAsync(updateDto.PhotoIds, updateDto.CategoryId);
        if (!result)
            return BadRequest("Failed to update photos");

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task&lt;ActionResult&gt; DeletePhoto(int id)
    {
        var result = await _photoService.DeletePhotoAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("bulk")]
    public async Task&lt;ActionResult&gt; DeleteMultiplePhotos([FromBody] BulkDeleteDto deleteDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _photoService.DeleteMultiplePhotosAsync(deleteDto.PhotoIds);
        if (!result)
            return BadRequest("Failed to delete photos");

        return NoContent();
    }

    [HttpGet("{id}/file")]
    public async Task&lt;ActionResult&gt; GetPhotoFile(int id)
    {
        var filePath = await _photoService.GetPhotoFilePathAsync(id);
        if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
            return NotFound();

        var contentType = GetContentType(filePath);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        
        return File(fileBytes, contentType);
    }

    private static bool IsImageFile(IFormFile file)
    {
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        return allowedExtensions.Contains(extension) && file.ContentType.StartsWith("image/");
    }

    private static string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" =&gt; "image/jpeg",
            ".png" =&gt; "image/png",
            ".gif" =&gt; "image/gif",
            ".bmp" =&gt; "image/bmp",
            ".webp" =&gt; "image/webp",
            _ =&gt; "application/octet-stream"
        };
    }
}

public class BulkUpdateCategoryDto
{
    public List&lt;int&gt; PhotoIds { get; set; } = new();
    public int CategoryId { get; set; }
}

public class BulkDeleteDto
{
    public List&lt;int&gt; PhotoIds { get; set; } = new();
}