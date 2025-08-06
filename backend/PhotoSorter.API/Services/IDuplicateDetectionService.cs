using PhotoSorter.API.DTOs;

namespace PhotoSorter.API.Services;

public interface IDuplicateDetectionService
{
    Task&lt;IEnumerable&lt;PhotoDto&gt;&gt; GetDuplicatePhotosAsync();
    Task&lt;bool&gt; MarkAsDuplicateAsync(int photoId, int originalPhotoId);
    Task&lt;bool&gt; RemoveDuplicateAsync(int duplicatePhotoId);
}