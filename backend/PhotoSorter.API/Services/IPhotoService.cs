using PhotoSorter.API.DTOs;
using PhotoSorter.API.Models;

namespace PhotoSorter.API.Services;

public interface IPhotoService
{
    Task&lt;IEnumerable&lt;PhotoDto&gt;&gt; GetAllPhotosAsync();
    Task&lt;IEnumerable&lt;PhotoDto&gt;&gt; GetPhotosByCategoryAsync(int categoryId);
    Task&lt;PhotoDto?&gt; GetPhotoByIdAsync(int id);
    Task&lt;PhotoDto&gt; CreatePhotoAsync(CreatePhotoDto createPhotoDto, IFormFile file);
    Task&lt;bool&gt; UpdatePhotoCategoryAsync(int id, int categoryId);
    Task&lt;bool&gt; UpdateMultiplePhotosCategoryAsync(List&lt;int&gt; photoIds, int categoryId);
    Task&lt;bool&gt; DeletePhotoAsync(int id);
    Task&lt;bool&gt; DeleteMultiplePhotosAsync(List&lt;int&gt; photoIds);
    Task&lt;string&gt; GetPhotoFilePathAsync(int id);
}