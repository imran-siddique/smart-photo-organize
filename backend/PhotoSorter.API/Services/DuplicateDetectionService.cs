using Microsoft.EntityFrameworkCore;
using PhotoSorter.API.Data;
using PhotoSorter.API.DTOs;

namespace PhotoSorter.API.Services;

public class DuplicateDetectionService : IDuplicateDetectionService
{
    private readonly PhotoSorterContext _context;

    public DuplicateDetectionService(PhotoSorterContext context)
    {
        _context = context;
    }

    public async Task&lt;IEnumerable&lt;PhotoDto&gt;&gt; GetDuplicatePhotosAsync()
    {
        var duplicates = await _context.Photos
            .Include(p =&gt; p.Category)
            .Include(p =&gt; p.OriginalPhoto)
            .Where(p =&gt; p.IsDuplicate)
            .OrderBy(p =&gt; p.OriginalPhotoId)
            .ThenBy(p =&gt; p.CreatedAt)
            .ToListAsync();

        return duplicates.Select(photo =&gt; new PhotoDto
        {
            Id = photo.Id,
            Name = photo.Name,
            FileName = photo.FileName,
            FilePath = photo.FilePath,
            ThumbnailPath = photo.ThumbnailPath,
            Size = photo.Size,
            ContentType = photo.ContentType,
            CreatedAt = photo.CreatedAt,
            LastModified = photo.LastModified,
            CategoryId = photo.CategoryId,
            CategoryName = photo.Category?.Name,
            IsDuplicate = photo.IsDuplicate,
            OriginalPhotoId = photo.OriginalPhotoId
        });
    }

    public async Task&lt;bool&gt; MarkAsDuplicateAsync(int photoId, int originalPhotoId)
    {
        var photo = await _context.Photos.FindAsync(photoId);
        var originalPhoto = await _context.Photos.FindAsync(originalPhotoId);

        if (photo == null || originalPhoto == null) return false;

        photo.IsDuplicate = true;
        photo.OriginalPhotoId = originalPhotoId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task&lt;bool&gt; RemoveDuplicateAsync(int duplicatePhotoId)
    {
        var photo = await _context.Photos.FindAsync(duplicatePhotoId);
        if (photo == null || !photo.IsDuplicate) return false;

        // Delete physical files
        try
        {
            if (File.Exists(photo.FilePath))
                File.Delete(photo.FilePath);
                
            if (!string.IsNullOrEmpty(photo.ThumbnailPath) && File.Exists(photo.ThumbnailPath))
                File.Delete(photo.ThumbnailPath);
        }
        catch (Exception)
        {
            // Continue with database removal even if file deletion fails
        }

        _context.Photos.Remove(photo);
        await _context.SaveChangesAsync();
        return true;
    }
}