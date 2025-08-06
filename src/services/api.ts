// API Configuration
export const API_BASE_URL = 'https://localhost:7001/api';

// API Response Types
export interface PhotoDto {
  id: number;
  name: string;
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  size: number;
  contentType: string;
  createdAt: string;
  lastModified?: string;
  categoryId?: number;
  categoryName?: string;
  isDuplicate: boolean;
  originalPhotoId?: number;
}

export interface CategoryDto {
  id: number;
  name: string;
  path: string;
  pattern: string;
  sortOrder: number;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  path: string;
  pattern: string;
  sortOrder: number;
}

export interface UpdateCategoryDto {
  name: string;
  path: string;
  pattern: string;
  sortOrder: number;
}

// API Service Class
class ApiService {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json();
  }

  // Category API Methods
  async getCategories(): Promise<CategoryDto[]> {
    return this.request<CategoryDto[]>('/categories');
  }

  async getCategory(id: number): Promise<CategoryDto> {
    return this.request<CategoryDto>(`/categories/${id}`);
  }

  async createCategory(category: CreateCategoryDto): Promise<CategoryDto> {
    return this.request<CategoryDto>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: number, category: UpdateCategoryDto): Promise<CategoryDto> {
    return this.request<CategoryDto>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderCategories(categories: { id: number; sortOrder: number }[]): Promise<void> {
    return this.request<void>('/categories/reorder', {
      method: 'POST',
      body: JSON.stringify({ categories }),
    });
  }

  async suggestCategory(fileName: string): Promise<number | null> {
    return this.request<number | null>(`/categories/suggest?fileName=${encodeURIComponent(fileName)}`);
  }

  // Photo API Methods
  async getPhotos(categoryId?: number): Promise<PhotoDto[]> {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request<PhotoDto[]>(`/photos${query}`);
  }

  async getPhoto(id: number): Promise<PhotoDto> {
    return this.request<PhotoDto>(`/photos/${id}`);
  }

  async uploadPhoto(file: File, name?: string, categoryId?: number): Promise<PhotoDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name.split('.')[0]);
    formData.append('fileName', file.name);
    formData.append('size', file.size.toString());
    formData.append('contentType', file.type);
    formData.append('lastModified', new Date(file.lastModified).toISOString());
    
    if (categoryId) {
      formData.append('categoryId', categoryId.toString());
    }

    const response = await fetch(`${this.baseUrl}/photos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return response.json();
  }

  async uploadMultiplePhotos(files: File[]): Promise<{ photos: PhotoDto[]; errors: string[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/photos/upload/multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return response.json();
  }

  async updatePhotoCategory(photoId: number, categoryId: number): Promise<void> {
    return this.request<void>(`/photos/${photoId}/category`, {
      method: 'PUT',
      body: JSON.stringify({ categoryId }),
    });
  }

  async updateMultiplePhotosCategory(photoIds: number[], categoryId: number): Promise<void> {
    return this.request<void>('/photos/bulk/category', {
      method: 'PUT',
      body: JSON.stringify({ photoIds, categoryId }),
    });
  }

  async deletePhoto(id: number): Promise<void> {
    return this.request<void>(`/photos/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteMultiplePhotos(photoIds: number[]): Promise<void> {
    return this.request<void>('/photos/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ photoIds }),
    });
  }

  async getPhotoFile(id: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/photos/${id}/file`);
    if (!response.ok) {
      throw new Error(`Failed to get photo file: ${response.statusText}`);
    }
    return response.blob();
  }

  // Duplicate Detection API Methods
  async getDuplicates(): Promise<PhotoDto[]> {
    return this.request<PhotoDto[]>('/duplicates');
  }

  async markAsDuplicate(photoId: number, originalPhotoId: number): Promise<void> {
    return this.request<void>(`/duplicates/${photoId}/mark-duplicate/${originalPhotoId}`, {
      method: 'POST',
    });
  }

  async removeDuplicate(duplicatePhotoId: number): Promise<void> {
    return this.request<void>(`/duplicates/${duplicatePhotoId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();