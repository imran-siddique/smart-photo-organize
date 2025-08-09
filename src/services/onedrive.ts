// OneDrive API Configuration and Types

const ONEDRIVE_CONFIG = {
  // Using Microsoft's public client ID for sample applications
  clientId: '04b07795-8ddb-461a-bbee-02f9e1bf7b46',
  redirectUri: window.location.origin,
  scope: 'Files.ReadWrite User.Read offline_access',
  authority: 'https://login.microsoftonline.com/common'
};

export interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  downloadUrl?: string;
  thumbnails?: {
    small?: {
      url: string;
      width: number;
      height: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
    };
    large?: {
      url: string;
      width: number;
      height: number;
    };
  }[];
  folder?: {
    childCount: number;
  };
  file?: {
    mimeType: string;
    hashes?: {
      sha1Hash?: string;
      quickXorHash?: string;
    };
  };
  image?: {
    width: number;
    height: number;
  };
  photo?: {
    takenDateTime: string;
    cameraMake?: string;
    cameraModel?: string;
  };
  parentReference: {
    id: string;
    path: string;
  };
}

export interface OneDriveUser {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
}

export interface BatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface BatchResponse<T> {
  id: string;
  status: number;
  headers?: Record<string, string>;
  body?: T;
}

export interface DuplicateGroup {
  id: string;
  items: OneDriveItem[];
  similarity: number;
  reason: string[];
}

export interface CategoryPattern {
  id: string;
  name: string;
  patterns: string[];
  folder: string;
  color: string;
  autoSort: boolean;
  sortOrder: number;
}

class OneDriveService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0';
  private readonly batchSize = 20;
  private readonly maxParallelRequests = 5;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('onedrive_access_token');
    this.refreshToken = localStorage.getItem('onedrive_refresh_token');
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('onedrive_access_token', accessToken);
    localStorage.setItem('onedrive_refresh_token', refreshToken);
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: ONEDRIVE_CONFIG.clientId,
      response_type: 'token',
      redirect_uri: ONEDRIVE_CONFIG.redirectUri,
      scope: ONEDRIVE_CONFIG.scope,
      response_mode: 'fragment'
    });

    return `${ONEDRIVE_CONFIG.authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(authFragment: string): Promise<boolean> {
    try {
      // Parse the fragment from the redirect URL
      const params = new URLSearchParams(authFragment.replace('#', ''));
      const accessToken = params.get('access_token');
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        throw new Error(errorDescription || error);
      }

      if (!accessToken) {
        throw new Error('No access token received');
      }

      // Store the token (no refresh token in implicit flow)
      this.saveTokensToStorage(accessToken, '');
      return true;
    } catch (error) {
      console.error('Token exchange error:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    // Implicit flow doesn't support refresh tokens
    // User will need to re-authenticate when token expires
    return false;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('onedrive_access_token');
    localStorage.removeItem('onedrive_refresh_token');
  }

  // HTTP Request Methods with Retry Logic
  private async request<T>(endpoint: string, options?: RequestInit, retries = 1): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (response.status === 401 && retries > 0) {
        // For implicit flow, we can't refresh tokens
        // User needs to re-authenticate
        this.logout();
        throw new Error('Session expired. Please authenticate again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json();
      }

      return response as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (retries > 0 && errorMessage.includes('Network')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  // Batch Processing Methods
  async processBatch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
    const batches = this.chunkArray(requests, this.batchSize);
    const allResponses: BatchResponse<T>[] = [];

    // Process batches in parallel with concurrency limit
    for (let i = 0; i < batches.length; i += this.maxParallelRequests) {
      const currentBatches = batches.slice(i, i + this.maxParallelRequests);
      const batchPromises = currentBatches.map(batch => this.executeBatch<T>(batch));
      
      const results = await Promise.allSettled(batchPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allResponses.push(...result.value);
        } else {
          console.error('Batch failed:', result.reason);
        }
      });
    }

    return allResponses;
  }

  private async executeBatch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
    const batchPayload = {
      requests: requests.map(req => ({
        id: req.id,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      }))
    };

    const response = await this.request<{ responses: BatchResponse<T>[] }>('/$batch', {
      method: 'POST',
      body: JSON.stringify(batchPayload)
    });

    return response.responses;
  }

  // OneDrive File Operations
  async getCurrentUser(): Promise<OneDriveUser> {
    return this.request<OneDriveUser>('/me');
  }

  async getItems(folderId: string = 'root', includeChildren: boolean = true): Promise<OneDriveItem[]> {
    const endpoint = includeChildren 
      ? `/me/drive/items/${folderId}/children`
      : `/me/drive/items/${folderId}`;
    
    const response = await this.request<{ value: OneDriveItem[] }>(endpoint);
    return response.value || [];
  }

  async getAllPhotos(): Promise<OneDriveItem[]> {
    const allItems: OneDriveItem[] = [];
    
    // Common photo locations in OneDrive
    const photoLocations = [
      'root:/Pictures',
      'root:/Camera Roll', 
      'root:/Screenshots',
      'root:/OneDrive - Photos'
    ];

    const requests: BatchRequest[] = photoLocations.map((path, index) => ({
      id: `photos-${index}`,
      method: 'GET',
      url: `/me/drive/${path}:/children?$filter=file ne null and startswith(file/mimeType,'image/')&$expand=thumbnails`
    }));

    const responses = await this.processBatch<{ value: OneDriveItem[] }>(requests);
    
    responses.forEach(response => {
      if (response.status === 200 && response.body?.value) {
        allItems.push(...response.body.value);
      }
    });

    // Also search for photos across the entire drive
    try {
      const searchResponse = await this.request<{ value: OneDriveItem[] }>(
        `/me/drive/root/search(q='*.jpg OR *.jpeg OR *.png OR *.gif OR *.bmp OR *.tiff')`
      );
      
      if (searchResponse.value) {
        // Filter out duplicates by ID
        const existingIds = new Set(allItems.map(item => item.id));
        const newItems = searchResponse.value.filter(item => !existingIds.has(item.id));
        allItems.push(...newItems);
      }
    } catch (error) {
      console.warn('Search photos failed:', error);
    }

    return allItems;
  }

  async getPhotoDetails(items: OneDriveItem[]): Promise<OneDriveItem[]> {
    const requests: BatchRequest[] = items.map((item, index) => ({
      id: `details-${index}`,
      method: 'GET',
      url: `/me/drive/items/${item.id}?$expand=thumbnails`
    }));

    const responses = await this.processBatch<OneDriveItem>(requests);
    const detailedItems: OneDriveItem[] = [];

    responses.forEach((response, index) => {
      if (response.status === 200 && response.body) {
        detailedItems.push(response.body);
      } else {
        // Fallback to original item if details fetch failed
        detailedItems.push(items[index]);
      }
    });

    return detailedItems;
  }

  async downloadPhoto(item: OneDriveItem): Promise<Blob> {
    if (item.downloadUrl) {
      const response = await fetch(item.downloadUrl);
      return response.blob();
    }

    const response = await this.request<Response>(`/me/drive/items/${item.id}/content`);
    return (response as Response).blob();
  }

  async createFolder(name: string, parentId: string = 'root'): Promise<OneDriveItem> {
    return this.request<OneDriveItem>(`/me/drive/items/${parentId}/children`, {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      })
    });
  }

  async moveItem(itemId: string, targetFolderId: string): Promise<OneDriveItem> {
    return this.request<OneDriveItem>(`/me/drive/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        parentReference: {
          id: targetFolderId
        }
      })
    });
  }

  async moveItems(items: { itemId: string; targetFolderId: string }[]): Promise<OneDriveItem[]> {
    const requests: BatchRequest[] = items.map((item, index) => ({
      id: `move-${index}`,
      method: 'PATCH',
      url: `/me/drive/items/${item.itemId}`,
      body: {
        parentReference: {
          id: item.targetFolderId
        }
      }
    }));

    const responses = await this.processBatch<OneDriveItem>(requests);
    return responses
      .filter(response => response.status === 200)
      .map(response => response.body as OneDriveItem);
  }

  async deleteItems(itemIds: string[]): Promise<string[]> {
    const requests: BatchRequest[] = itemIds.map((id, index) => ({
      id: `delete-${index}`,
      method: 'DELETE',
      url: `/me/drive/items/${id}`
    }));

    const responses = await this.processBatch(requests);
    return responses
      .filter(response => response.status === 204 || response.status === 200)
      .map(response => response.id.replace('delete-', ''));
  }

  // Duplicate Detection Methods
  async findDuplicatePhotos(items: OneDriveItem[], options: {
    checkFileSize: boolean;
    checkFilename: boolean;
    checkHash: boolean;
    similarityThreshold: number;
  }): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedItems = new Set<string>();

    // Process items in parallel chunks
    const chunks = this.chunkArray(items, 50);

    for (const chunk of chunks) {
      const chunkDuplicates = await this.findDuplicatesInChunk(chunk, options, processedItems);
      duplicateGroups.push(...chunkDuplicates);
    }

    return duplicateGroups;
  }

  private async findDuplicatesInChunk(
    items: OneDriveItem[],
    options: any,
    processedItems: Set<string>
  ): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];

    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];
      if (processedItems.has(item1.id)) continue;

      const duplicates: OneDriveItem[] = [item1];
      const reasons: string[] = [];

      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        if (processedItems.has(item2.id)) continue;

        const similarity = this.calculateSimilarity(item1, item2, options);

        if (similarity.score >= options.similarityThreshold) {
          duplicates.push(item2);
          reasons.push(...similarity.reasons);
        }
      }

      if (duplicates.length > 1) {
        duplicateGroups.push({
          id: `group-${Date.now()}-${i}`,
          items: duplicates,
          similarity: this.calculateGroupSimilarity(duplicates, options),
          reason: [...new Set(reasons)]
        });
        
        duplicates.forEach(item => processedItems.add(item.id));
      }
    }

    return duplicateGroups;
  }

  private calculateSimilarity(
    item1: OneDriveItem,
    item2: OneDriveItem,
    options: any
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    let totalChecks = 0;

    if (options.checkFileSize) {
      totalChecks++;
      if (Math.abs(item1.size - item2.size) / Math.max(item1.size, item2.size) < 0.1) {
        score += 30;
        reasons.push('Similar file size');
      }
    }

    if (options.checkFilename) {
      totalChecks++;
      const similarity = this.calculateNameSimilarity(item1.name, item2.name);
      if (similarity > 0.7) {
        score += 40;
        reasons.push('Similar filename');
      }
    }

      if (options.checkHash && item1.file?.hashes && item2.file?.hashes) {
        if (item1.file.hashes.sha1Hash === item2.file.hashes.sha1Hash) {
          score += 50;
          reasons.push('Identical content hash');
        } else if (item1.file.hashes.quickXorHash === item2.file.hashes.quickXorHash) {
          score += 45;
          reasons.push('Similar content hash');
        }
      }

    return { score: Math.min(100, score), reasons };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1;

    const longer = n1.length > n2.length ? n1 : n2;
    const shorter = n1.length > n2.length ? n2 : n1;

    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateGroupSimilarity(items: OneDriveItem[], options: any): number {
    if (items.length < 2) return 0;

    let totalScore = 0;
    let comparisons = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = this.calculateSimilarity(items[i], items[j], options);
        totalScore += similarity.score;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0;
  }

  // Utility Methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getThumbnailUrl(item: OneDriveItem, size: 'small' | 'medium' | 'large' = 'medium'): string | null {
    return item.thumbnails?.[0]?.[size]?.url || null;
  }

  isImage(item: OneDriveItem): boolean {
    return item.file?.mimeType?.startsWith('image/') ?? false;
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export const oneDriveService = new OneDriveService();