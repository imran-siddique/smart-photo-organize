// OneDrive API Configuration and Types
  clientId: import.meta.env.VITE
  clientId: process.env.VITE_ONEDRIVE_CLIENT_ID || 'your-onedrive-client-id',
  redirectUri: window.location.origin + '/auth/callback',
};
  authority: 'https://login.microsoftonline.com/common'
  

  downloadUrl?: string;
    medium?: 
      width: nu
    };
  folder?: {
  };
    mimeType: string
      sha1Hash?: 
  downloadUrl?: string;
  thumbnails?: {
    medium?: {
      url: string;
      width: number;
      height: number;
  phot
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
  displayNa
    width: number;
    height: number;
  };
  id: strin
    takenDateTime: string;
    cameraMake?: string;
    cameraModel?: string;

  parentReference: {
    id: string;
    path: string;
}
}

export interface OneDriveUser {
  reason: str
  displayName: string;
  mail?: string;
  userPrincipalName: string;
 

export interface BatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
 

    try {
        metho
          'Conten
        body: new URLSearchParams({
          
 


        throw

      this.saveTokens
    } catch (error)
 

  async refreshAccessToken(): Prom

      const res
        headers: {
        },
          client
          refresh_to
        }),



      this.saveTokensToStorage(data.access_t
    } catch (error) {
      return false;
  }
  isAuthenticated(): boolean {

  logout() {
    this.refreshToken = null;
   

  private async request<T>(
      throw new Error('No access to


   

          ...options?.headers,
        ...options,

    
          return this.r
        throw new Error('Authentication

     
   

        return response.json();

    } catch (error) {
        await new Promise(re
      }
    }

  async

    // Process batches in parallel with concurrency limit
   

      results.forEach((result) => {
    try {
      const response = await fetch(`${ONEDRIVE_CONFIG.authority}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ONEDRIVE_CONFIG.clientId,
          scope: ONEDRIVE_CONFIG.scope,
          code: code,
          redirect_uri: ONEDRIVE_CONFIG.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data = await response.json();
      this.saveTokensToStorage(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token exchange error:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${ONEDRIVE_CONFIG.authority}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ONEDRIVE_CONFIG.clientId,
          scope: ONEDRIVE_CONFIG.scope,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.saveTokensToStorage(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
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
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request(endpoint, options, retries - 1);
        }
        throw new Error('Authentication failed');
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
      if (retries > 0 && error.message.includes('Network')) {
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
    return this.request<OneDriveItem>(`/me/drive/items/${itemId}`,
        }
        p
    }

    return allResponses;


  private async executeBatch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
    const batchPayload = {
      requests: requests.map(req => ({
        id: req.id,
        }
        url: req.url,

        body: req.body
      .fi
    };

    const response = await this.request<{ responses: BatchResponse<T>[] }>('/$batch', {
      id: `delete-${i
      body: JSON.stringify(batchPayload)
    }))

    return response.responses;


  // OneDrive File Operations
  async getCurrentUser(): Promise<OneDriveUser> {
    return this.request<OneDriveUser>('/me');
  }

  async getItems(folderId: string = 'root', includeChildren: boolean = true): Promise<OneDriveItem[]> {
    const endpoint = includeChildren 
      ? `/me/drive/items/${folderId}/children`
      : `/me/drive/items/${folderId}`;
    
    const response = await this.request<{ value: OneDriveItem[] }>(endpoint);
    }
  }

  async getAllPhotos(): Promise<OneDriveItem[]> {
    const allItems: OneDriveItem[] = [];
    
  ): Promise<DuplicateGroup[]> {
    const photoLocations = [
      'root:/Pictures',
      'root:/Camera Roll', 
      'root:/Screenshots',
      'root:/OneDrive - Photos'
    ];

    const requests: BatchRequest[] = photoLocations.map((path, index) => ({
      id: `photos-${index}`,
        
      url: `/me/drive/${path}:/children?$filter=file ne null and startswith(file/mimeType,'image/')&$expand=thumbnails`
        

    const responses = await this.processBatch<{ value: OneDriveItem[] }>(requests);
    
    responses.forEach(response => {
      if (response.status === 200 && response.body?.value) {
          similarity: this.calculateGroupSimil
      }
       

    // Also search for photos across the entire drive
    try {
      const searchResponse = await this.request<{ value: OneDriveItem[] }>(
        `/me/drive/root/search(q='*.jpg OR *.jpeg OR *.png OR *.gif OR *.bmp OR *.tiff')`
    item
      
  ): { score: number; reasons: st
        // Filter out duplicates by ID
        const existingIds = new Set(allItems.map(item => item.id));
        const newItems = searchResponse.value.filter(item => !existingIds.has(item.id));
      totalChecks++;
      }
        reasons.push(
      console.warn('Search photos failed:', error);


    return allItems;
  }

  async getPhotoDetails(items: OneDriveItem[]): Promise<OneDriveItem[]> {
    const requests: BatchRequest[] = items.map((item, index) => ({
      id: `details-${index}`,
      if (item1.file
      url: `/me/drive/items/${item.id}?$expand=thumbnails`
      } 

    const responses = await this.processBatch<OneDriveItem>(requests);
    const detailedItems: OneDriveItem[] = [];

    responses.forEach((response, index) => {
      if (response.status === 200 && response.body) {
        detailedItems.push(response.body);
    const n2 =
        // Fallback to original item if details fetch failed
        detailedItems.push(items[index]);
      }
    

    const distance = this
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
    for 
    });
   

  async moveItem(itemId: string, targetFolderId: string): Promise<OneDriveItem> {
    return this.request<OneDriveItem>(`/me/drive/items/${itemId}`, {
  }
      body: JSON.stringify({
        parentReference: {
          id: targetFolderId
        }
      })
  }
  }

  async moveItems(items: { itemId: string; targetFolderId: string }[]): Promise<OneDriveItem[]> {
    const requests: BatchRequest[] = items.map((item, index) => ({
      id: `move-${index}`,

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

  }

  async deleteItems(itemIds: string[]): Promise<string[]> {
    const requests: BatchRequest[] = itemIds.map((id, index) => ({
      id: `delete-${index}`,

      url: `/me/drive/items/${id}`


    const responses = await this.processBatch(requests);
    return responses
      .filter(response => response.status === 204 || response.status === 200)
      .map(response => response.id.replace('delete-', ''));


  // Duplicate Detection Methods
  async findDuplicatePhotos(items: OneDriveItem[], options: {

    checkFilename: boolean;

    similarityThreshold: number;
  }): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];


    // Process items in parallel chunks
    const chunks = this.chunkArray(items, 50);

    for (const chunk of chunks) {
      const chunkDuplicates = await this.findDuplicatesInChunk(chunk, options, processedItems);
      duplicateGroups.push(...chunkDuplicates);
    }

    return duplicateGroups;
  }

  private async findDuplicatesInChunk(

    options: any,
    processedItems: Set<string>
  ): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];


      const item1 = items[i];


      const duplicates: OneDriveItem[] = [item1];
      const reasons: string[] = [];

      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        if (processedItems.has(item2.id)) continue;

        const similarity = this.calculateSimilarity(item1, item2, options);

        if (similarity.score >= options.similarityThreshold) {

          reasons.push(...similarity.reasons);

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

  private calculateSimilarity(

    item2: OneDriveItem,
    options: any
  ): { score: number; reasons: string[] } {

    const reasons: string[] = [];



      totalChecks++;

        score += 30;
        reasons.push('Similar file size');
      }



      totalChecks++;
      const similarity = this.calculateNameSimilarity(item1.name, item2.name);
      if (similarity > 0.7) {

        reasons.push('Similar filename');



    if (options.checkHash && item1.file?.hashes && item2.file?.hashes) {
      totalChecks++;
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

    const n1 = normalize(name1);
    const n2 = normalize(name2);
    


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

        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,

          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateGroupSimilarity(items: OneDriveItem[], options: any): number {
    if (items.length < 2) return 0;


    let comparisons = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = this.calculateSimilarity(items[i], items[j], options);
        totalScore += similarity.score;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0;



  private chunkArray<T>(array: T[], size: number): T[][] {

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

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

    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;

    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;

}

export const oneDriveService = new OneDriveService();