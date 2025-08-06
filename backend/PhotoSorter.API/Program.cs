using Microsoft.EntityFrameworkCore;
using PhotoSorter.API.Data;
using PhotoSorter.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework
builder.Services.AddDbContext&lt;PhotoSorterContext&gt;(options =&gt;
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add custom services
builder.Services.AddScoped&lt;IPhotoService, PhotoService&gt;();
builder.Services.AddScoped&lt;ICategoryService, CategoryService&gt;();
builder.Services.AddScoped&lt;IDuplicateDetectionService, DuplicateDetectionService&gt;();

// Add CORS for frontend
builder.Services.AddCors(options =&gt;
{
    options.AddPolicy("AllowFrontend", policy =&gt;
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService&lt;PhotoSorterContext&gt;();
    context.Database.EnsureCreated();
}

app.Run();