using Microsoft.EntityFrameworkCore;
using PhotoSorter.API.Data;
using PhotoSorter.API.DTOs;
using PhotoSorter.API.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Security.Cryptography;

namespace PhotoSorter.API.Services;

public class PhotoService : IPhotoService
{
    private readonly PhotoSorterContext _context;
    private readonly IConfiguration _configuration;
    private readonly ICategoryService _categoryService;
    private readonly IDuplicateDetectionService _duplicateDetectionService;

    public PhotoService(PhotoSorterContext context, IConfiguration configuration, 
        ICategoryService categoryService, IDuplicateDetectionService duplicateDetectionService)
    {
        _context = context;
        _configuration = configuration;
        _categoryService = categoryService;
        _duplicateDetectionService = duplicateDetectionService;
    }

    public async Task&lt;IEnumerable&lt;PhotoDto&gt;&gt; GetAllPhotosAsync()
    {
        var photos = await _context.Photos
            .Include(p =&gt; p.Category)
            .OrderByDescending(p =&gt; p.CreatedAt)
            .ToListAsync();

        return photos.Select(MapToDto);
    }

    public async Task&lt;IEnumerable&lt;PhotoDto&gt;&gt; GetPhotosByCategoryAsync(int categoryId)
    {
        var photos = await _context.Photos
            .Include(p =&gt; p.Category)
            .Where(p =&gt; p.CategoryId == categoryId)
            .OrderByDescending(p =&gt; p.CreatedAt)
            .ToListAsync();

        return photos.Select(MapToDto);
    }

    public async Task&lt;PhotoDto?&gt; GetPhotoByIdAsync(int id)
    {
        var photo = await _context.Photos
            .Include(p =&gt; p.Category)
            .FirstOrDefaultAsync(p =&gt; p.Id == id);

        return photo == null ? null : MapToDto(photo);
    }

    public async Task&lt;PhotoDto&gt; CreatePhotoAsync(CreatePhotoDto createPhotoDto, IFormFile file)
    {
        // Generate file hash for duplicate detection
        var fileHash = await ComputeFileHashAsync(file);
        
        // Check for duplicates
        var existingPhoto = await _context.Photos
            .FirstOrDefaultAsync(p =&gt; p.FileHash == fileHash);

        var photosPath = _configuration["FileStorage:PhotosPath"] ?? "wwwroot/photos";
        var thumbnailsPath = _configuration["FileStorage:ThumbnailsPath"] ?? "wwwroot/thumbnails";
        
        // Ensure directories exist
        Directory.CreateDirectory(photosPath);
        Directory.CreateDirectory(thumbnailsPath);

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(photosPath, uniqueFileName);
        var thumbnailPath = Path.Combine(thumbnailsPath, $"thumb_{uniqueFileName}");

        // Save original file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Generate thumbnail
        await CreateThumbnailAsync(filePath, thumbnailPath);

        // Suggest category if not provided
        var categoryId = createPhotoDto.CategoryId;
        if (categoryId == null || categoryId == 0)
        {
            categoryId = await _categoryService.SuggestCategoryAsync(createPhotoDto.FileName);
        }

        var photo = new Photo
        {
            Name = createPhotoDto.Name,
            FileName = createPhotoDto.FileName,
            FilePath = filePath,
            ThumbnailPath = thumbnailPath,
            Size = createPhotoDto.Size,
            ContentType = createPhotoDto.ContentType,
            FileHash = fileHash,
            CategoryId = categoryId,
            LastModified = createPhotoDto.LastModified,
            IsDuplicate = existingPhoto != null,
            OriginalPhotoId = existingPhoto?.Id,
            CreatedAt = DateTime.UtcNow
        };

        _context.Photos.Add(photo);
        await _context.SaveChangesAsync();

        // Load category for DTO mapping
        await _context.Entry(photo).Reference(p =&gt; p.Category).LoadAsync();

        return MapToDto(photo);
    }

    public async Task&lt;bool&gt; UpdatePhotoCategoryAsync(int id, int categoryId)
    {
        var photo = await _context.Photos.FindAsync(id);
        if (photo == null) return false;

        photo.CategoryId = categoryId;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task&lt;bool&gt; UpdateMultiplePhotosCategoryAsync(List&lt;int&gt; photoIds, int categoryId)
    {
        var photos = await _context.Photos
            .Where(p =&gt; photoIds.Contains(p.Id))
            .ToListAsync();

        foreach (var photo in photos)
        {
            photo.CategoryId = categoryId;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task&lt;bool&gt; DeletePhotoAsync(int id)
    {
        var photo = await _context.Photos.FindAsync(id);
        if (photo == null) return false;

        // Delete physical files
        DeletePhotoFiles(photo);

        _context.Photos.Remove(photo);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task&lt;bool&gt; DeleteMultiplePhotosAsync(List&lt;int&gt; photoIds)
    {
        var photos = await _context.Photos
            .Where(p =&gt; photoIds.Contains(p.Id))
            .ToListAsync();

        foreach (var photo in photos)
        {
            DeletePhotoFiles(photo);
        }

        _context.Photos.RemoveRange(photos);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task&lt;string&gt; GetPhotoFilePathAsync(int id)
    {
        var photo = await _context.Photos.FindAsync(id);
        return photo?.FilePath ?? string.Empty;
    }

    private void DeletePhotoFiles(Photo photo)
    {
        try
        {
            if (File.Exists(photo.FilePath))
                File.Delete(photo.FilePath);
            
            if (!string.IsNullOrEmpty(photo.ThumbnailPath) && File.Exists(photo.ThumbnailPath))
                File.Delete(photo.ThumbnailPath);
        }
        catch (Exception)
        {
            // Log error but don't throw - we still want to remove from database
        }
    }

    private async Task&lt;string&gt; ComputeFileHashAsync(IFormFile file)
    {
        using var md5 = MD5.Create();
        using var stream = file.OpenReadStream();
        var hash = await Task.Run(() =&gt; md5.ComputeHash(stream));
        return Convert.ToBase64String(hash);
    }

    private async Task CreateThumbnailAsync(string originalPath, string thumbnailPath)
    {
        try
        {
            using var image = await Image.LoadAsync(originalPath);
            image.Mutate(x =&gt; x.Resize(200, 200, KnownResamplers.Lanczos3));
            await image.SaveAsJpegAsync(thumbnailPath);
        }
        catch (Exception)
        {
            // If thumbnail creation fails, continue without it
        }
    }

    private static PhotoDto MapToDto(Photo photo)
    {
        return new PhotoDto
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
        };
    }
}