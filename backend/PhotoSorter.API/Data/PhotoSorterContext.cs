using Microsoft.EntityFrameworkCore;
using PhotoSorter.API.Models;

namespace PhotoSorter.API.Data;

public class PhotoSorterContext : DbContext
{
    public PhotoSorterContext(DbContextOptions&lt;PhotoSorterContext&gt; options) : base(options) { }

    public DbSet&lt;Photo&gt; Photos { get; set; }
    public DbSet&lt;Category&gt; Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Photo entity configuration
        modelBuilder.Entity&lt;Photo&gt;(entity =&gt;
        {
            entity.HasKey(p =&gt; p.Id);
            entity.HasIndex(p =&gt; p.FileHash);
            entity.HasIndex(p =&gt; p.FileName);
            
            // Self-referencing relationship for duplicates
            entity.HasOne(p =&gt; p.OriginalPhoto)
                  .WithMany(p =&gt; p.Duplicates)
                  .HasForeignKey(p =&gt; p.OriginalPhotoId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            // Category relationship
            entity.HasOne(p =&gt; p.Category)
                  .WithMany(c =&gt; c.Photos)
                  .HasForeignKey(p =&gt; p.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Category entity configuration
        modelBuilder.Entity&lt;Category&gt;(entity =&gt;
        {
            entity.HasKey(c =&gt; c.Id);
            entity.HasIndex(c =&gt; c.Name).IsUnique();
            entity.HasIndex(c =&gt; c.SortOrder);
        });

        // Seed default categories
        modelBuilder.Entity&lt;Category&gt;().HasData(
            new Category { Id = 1, Name = "Events", Path = "Events/", Pattern = "contains: party, wedding, birthday, event", SortOrder = 1 },
            new Category { Id = 2, Name = "Nature", Path = "Nature/", Pattern = "contains: landscape, tree, flower, outdoor", SortOrder = 2 },
            new Category { Id = 3, Name = "Family", Path = "Family/", Pattern = "contains: family, kids, parents, relatives", SortOrder = 3 },
            new Category { Id = 4, Name = "Travel", Path = "Travel/", Pattern = "contains: vacation, trip, city, landmark", SortOrder = 4 },
            new Category { Id = 5, Name = "Portraits", Path = "Portraits/", Pattern = "contains: headshot, portrait, person, face", SortOrder = 5 },
            new Category { Id = 6, Name = "Unsorted", Path = "Unsorted/", Pattern = "default category for uncategorized photos", SortOrder = 99 }
        );
    }
}