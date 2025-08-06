using Microsoft.AspNetCore.Mvc;
using PhotoSorter.API.DTOs;
using PhotoSorter.API.Services;

namespace PhotoSorter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DuplicatesController : ControllerBase
{
    private readonly IDuplicateDetectionService _duplicateDetectionService;

    public DuplicatesController(IDuplicateDetectionService duplicateDetectionService)
    {
        _duplicateDetectionService = duplicateDetectionService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;IEnumerable&lt;PhotoDto&gt;&gt;&gt; GetDuplicates()
    {
        var duplicates = await _duplicateDetectionService.GetDuplicatePhotosAsync();
        return Ok(duplicates);
    }

    [HttpPost("{photoId}/mark-duplicate/{originalPhotoId}")]
    public async Task&lt;ActionResult&gt; MarkAsDuplicate(int photoId, int originalPhotoId)
    {
        var result = await _duplicateDetectionService.MarkAsDuplicateAsync(photoId, originalPhotoId);
        if (!result)
            return NotFound("Photo not found or invalid original photo");

        return NoContent();
    }

    [HttpDelete("{duplicatePhotoId}")]
    public async Task&lt;ActionResult&gt; RemoveDuplicate(int duplicatePhotoId)
    {
        var result = await _duplicateDetectionService.RemoveDuplicateAsync(duplicatePhotoId);
        if (!result)
            return NotFound("Duplicate photo not found");

        return NoContent();
    }
}