import React from 'react';
import { oneDriveService, OneDriveItem, DuplicateGroup, CategoryPattern } from '@/services/onedrive';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';

interface UseOneDriveState {
  user: any | null;
  items: OneDriveItem[];
  filteredItems: OneDriveItem[];
  categories: CategoryPattern[];
  duplicateGroups: DuplicateGroup[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoadingItems: boolean;
  isDuplicateDetectionRunning: boolean;
  error: string | null;
  progress: {
    current: number;
    total: number;
    operation: string;
  } | null;
}

interface UseOneDriveActions {
  authenticate: () => Promise<void>;
  logout: () => void;
  loadItems: (refresh?: boolean) => Promise<void>;
  loadCategories: () => Promise<void>;
  createCategory: (category: Omit<CategoryPattern, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryPattern>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveItemsToCategory: (itemIds: string[], categoryId: string) => Promise<void>;
  deleteItems: (itemIds: string[]) => Promise<void>;
  runDuplicateDetection: (options: {
    checkFileSize: boolean;
    checkFilename: boolean;
    checkHash: boolean;
    similarityThreshold: number;
  }) => Promise<void>;
  processDuplicateGroups: (groupIds: string[], action: 'keep-first' | 'keep-largest' | 'keep-newest') => Promise<void>;
  filterItems: (query: string, categoryId?: string) => void;
  handleAuthCallback: (authFragment: string) => Promise<boolean>;
}

const defaultState: UseOneDriveState = {
  user: null,
  items: [],
  filteredItems: [],
  categories: [],
  duplicateGroups: [],
  isAuthenticated: false,
  isLoading: false,
  isLoadingItems: false,
  isDuplicateDetectionRunning: false,
  error: null,
  progress: null
};

export function useOneDrive(): UseOneDriveState & UseOneDriveActions {
  const [state, setState] = React.useState<UseOneDriveState>(defaultState);
  const [categories, setCategories] = useKV<CategoryPattern[]>('photo-sorter-categories', []);
  const [duplicateGroups, setDuplicateGroups] = useKV<DuplicateGroup[]>('photo-sorter-duplicates', []);

  // Check authentication on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = oneDriveService.isAuthenticated();
      setState(prev => ({ ...prev, isAuthenticated: isAuth }));

      if (isAuth) {
        try {
          const user = await oneDriveService.getCurrentUser();
          setState(prev => ({ ...prev, user }));
        } catch (error) {
          console.error('Failed to load user:', error);
          setState(prev => ({ ...prev, error: 'Failed to load user information' }));
        }
      }
    };

    checkAuth();
  }, []);

  // Sync categories to state
  React.useEffect(() => {
    setState(prev => ({ ...prev, categories: categories || [] }));
  }, [categories]);

  // Sync duplicate groups to state
  React.useEffect(() => {
    setState(prev => ({ ...prev, duplicateGroups: duplicateGroups || [] }));
  }, [duplicateGroups]);

  const authenticate = async (): Promise<void> => {
    try {
      const authUrl = oneDriveService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Authentication failed:', error);
      setState(prev => ({ ...prev, error: 'Authentication failed' }));
      toast.error('Authentication failed');
    }
  };

  const handleAuthCallback = async (authFragment: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await oneDriveService.exchangeCodeForTokens(authFragment);
      
      if (success) {
        const user = await oneDriveService.getCurrentUser();
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: true, 
          user,
          isLoading: false 
        }));
        await loadItems();
        toast.success('Successfully connected to OneDrive');
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to authenticate',
          isLoading: false 
        }));
        toast.error('Failed to authenticate');
        return false;
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Authentication error',
        isLoading: false 
      }));
      toast.error('Authentication error');
      return false;
    }
  };

  const logout = (): void => {
    oneDriveService.logout();
    setState(defaultState);
    toast.success('Logged out from OneDrive');
  };

  const loadItems = async (refresh: boolean = false): Promise<void> => {
    if (!oneDriveService.isAuthenticated()) return;

    try {
      setState(prev => ({ ...prev, isLoadingItems: true, error: null }));

      // Update progress
      setState(prev => ({
        ...prev,
        progress: { current: 0, total: 100, operation: 'Loading photos from OneDrive...' }
      }));

      const photos = await oneDriveService.getAllPhotos();
      
      setState(prev => ({
        ...prev,
        progress: { current: 50, total: 100, operation: 'Getting photo details...' }
      }));

      const detailedPhotos = await oneDriveService.getPhotoDetails(photos);
      
      setState(prev => ({
        ...prev,
        items: detailedPhotos,
        filteredItems: detailedPhotos,
        isLoadingItems: false,
        progress: null
      }));

      toast.success(`Loaded ${detailedPhotos.length} photos from OneDrive`);
    } catch (error) {
      console.error('Failed to load items:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load photos',
        isLoadingItems: false,
        progress: null
      }));
      toast.error('Failed to load photos from OneDrive');
    }
  };

  const loadCategories = async (): Promise<void> => {
    // Categories are loaded from KV store automatically
  };

  const createCategory = async (category: Omit<CategoryPattern, 'id'>): Promise<void> => {
    try {
      const newCategory: CategoryPattern = {
        ...category,
        id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedCategories = [...(categories || []), newCategory];
      setCategories(updatedCategories);

      // Create folder in OneDrive if specified
      if (category.folder) {
        await oneDriveService.createFolder(category.name);
      }

      toast.success('Category created successfully');
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    }
  };

  const updateCategory = async (id: string, updates: Partial<CategoryPattern>): Promise<void> => {
    try {
      const currentCategories = categories || []
      const updatedCategories = currentCategories.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      );
      setCategories(updatedCategories);
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      const currentCategories = categories || []
      const updatedCategories = currentCategories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  };

  const moveItemsToCategory = async (itemIds: string[], categoryId: string): Promise<void> => {
    try {
      const currentCategories = categories || []
      const category = currentCategories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      setState(prev => ({
        ...prev,
        progress: { 
          current: 0, 
          total: itemIds.length, 
          operation: `Moving ${itemIds.length} photos to ${category.name}...` 
        }
      }));

      // Create folder if it doesn't exist
      let targetFolder;
      try {
        targetFolder = await oneDriveService.createFolder(category.name);
      } catch (error) {
        // Folder might already exist, try to find it
        const items = await oneDriveService.getItems('root');
        targetFolder = items.find(item => item.folder && item.name === category.name);
        if (!targetFolder) throw error;
      }

      // Move items in batches
      const moveRequests = itemIds.map(itemId => ({
        itemId,
        targetFolderId: targetFolder.id
      }));

      const batchSize = 20;
      let processed = 0;

      for (let i = 0; i < moveRequests.length; i += batchSize) {
        const batch = moveRequests.slice(i, i + batchSize);
        await oneDriveService.moveItems(batch);
        processed += batch.length;

        setState(prev => ({
          ...prev,
          progress: prev.progress ? { 
            ...prev.progress,
            current: processed 
          } : null
        }));
      }

      // Refresh items
      await loadItems();
      
      setState(prev => ({ ...prev, progress: null }));
      toast.success(`Moved ${itemIds.length} photos to ${category.name}`);
    } catch (error) {
      console.error('Failed to move items:', error);
      setState(prev => ({ ...prev, progress: null }));
      toast.error('Failed to move photos');
    }
  };

  const deleteItems = async (itemIds: string[]): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        progress: { 
          current: 0, 
          total: itemIds.length, 
          operation: `Deleting ${itemIds.length} photos...` 
        }
      }));

      const deletedIds = await oneDriveService.deleteItems(itemIds);
      
      // Update local state
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => !deletedIds.includes(item.id)),
        filteredItems: prev.filteredItems.filter(item => !deletedIds.includes(item.id)),
        progress: null
      }));

      toast.success(`Deleted ${deletedIds.length} photos`);
    } catch (error) {
      console.error('Failed to delete items:', error);
      setState(prev => ({ ...prev, progress: null }));
      toast.error('Failed to delete photos');
    }
  };

  const runDuplicateDetection = async (options: {
    checkFileSize: boolean;
    checkFilename: boolean;
    checkHash: boolean;
    similarityThreshold: number;
  }): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isDuplicateDetectionRunning: true }));

      setState(prev => ({
        ...prev,
        progress: { 
          current: 0, 
          total: state.items.length, 
          operation: 'Detecting duplicate photos...' 
        }
      }));

      const duplicates = await oneDriveService.findDuplicatePhotos(state.items, options);
      setDuplicateGroups(duplicates);

      setState(prev => ({ 
        ...prev, 
        isDuplicateDetectionRunning: false,
        progress: null
      }));

      toast.success(`Found ${duplicates.length} duplicate groups`);
    } catch (error) {
      console.error('Failed to detect duplicates:', error);
      setState(prev => ({ 
        ...prev, 
        isDuplicateDetectionRunning: false,
        progress: null
      }));
      toast.error('Failed to detect duplicates');
    }
  };

  const processDuplicateGroups = async (
    groupIds: string[], 
    action: 'keep-first' | 'keep-largest' | 'keep-newest'
  ): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        progress: { 
          current: 0, 
          total: groupIds.length, 
          operation: `Processing ${groupIds.length} duplicate groups...` 
        }
      }));

      let processedGroups = 0;
      const itemsToDelete: string[] = [];

      for (const groupId of groupIds) {
        const currentDuplicateGroups = duplicateGroups || []
        const group = currentDuplicateGroups.find(g => g.id === groupId);
        if (!group || group.items.length < 2) continue;

        let keepItem: OneDriveItem;
        
        switch (action) {
          case 'keep-first':
            keepItem = group.items[0];
            break;
          case 'keep-largest':
            keepItem = group.items.reduce((largest, current) =>
              current.size > largest.size ? current : largest
            );
            break;
          case 'keep-newest':
            keepItem = group.items.reduce((newest, current) =>
              new Date(current.lastModifiedDateTime) > new Date(newest.lastModifiedDateTime) 
                ? current : newest
            );
            break;
          default:
            keepItem = group.items[0];
        }

        // Mark other items for deletion
        group.items.forEach(item => {
          if (item.id !== keepItem.id) {
            itemsToDelete.push(item.id);
          }
        });

        processedGroups++;
        setState(prev => ({
          ...prev,
          progress: prev.progress ? { 
            ...prev.progress,
            current: processedGroups 
          } : null
        }));
      }

      // Delete items in batches
      if (itemsToDelete.length > 0) {
        await deleteItems(itemsToDelete);
      }

      // Remove processed groups
      const currentDuplicateGroups = duplicateGroups || []
      const updatedGroups = currentDuplicateGroups.filter(group => !groupIds.includes(group.id));
      setDuplicateGroups(updatedGroups);

      setState(prev => ({ ...prev, progress: null }));
      toast.success(`Processed ${processedGroups} duplicate groups, deleted ${itemsToDelete.length} photos`);
    } catch (error) {
      console.error('Failed to process duplicate groups:', error);
      setState(prev => ({ ...prev, progress: null }));
      toast.error('Failed to process duplicate groups');
    }
  };

  const filterItems = (query: string, categoryId?: string): void => {
    let filtered = state.items;

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(lowercaseQuery)
      );
    }

    if (categoryId) {
      const currentCategories = categories || []
      const category = currentCategories.find(cat => cat.id === categoryId);
      if (category) {
        filtered = filtered.filter(item =>
          category.patterns.some(pattern =>
            item.name.toLowerCase().includes(pattern.toLowerCase()) ||
            item.parentReference.path.toLowerCase().includes(pattern.toLowerCase())
          )
        );
      }
    }

    setState(prev => ({ ...prev, filteredItems: filtered }));
  };

  return {
    ...state,
    authenticate,
    logout,
    loadItems,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    moveItemsToCategory,
    deleteItems,
    runDuplicateDetection,
    processDuplicateGroups,
    filterItems,
    handleAuthCallback
  };
}