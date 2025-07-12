export interface StorageItem {
  id: string;
  name: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  requests: any[];
  createdAt: Date;
  updatedAt: Date;
}

class LocalStorage {
  private getKey(key: string): string {
    return `devtoolnest-${key}`;
  }

  set(key: string, value: any): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('devtoolnest-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  // Collections for API requests
  getCollections(): Collection[] {
    return this.get<Collection[]>('collections') || [];
  }

  saveCollection(collection: Collection): void {
    const collections = this.getCollections();
    const existingIndex = collections.findIndex(c => c.id === collection.id);
    
    if (existingIndex >= 0) {
      collections[existingIndex] = { ...collection, updatedAt: new Date() };
    } else {
      collections.push(collection);
    }
    
    this.set('collections', collections);
  }

  deleteCollection(id: string): void {
    const collections = this.getCollections();
    const filtered = collections.filter(c => c.id !== id);
    this.set('collections', filtered);
  }

  // Generic storage for tool data
  getToolData(toolId: string): any {
    return this.get(`tool-${toolId}`);
  }

  saveToolData(toolId: string, data: any): void {
    this.set(`tool-${toolId}`, data);
  }

  deleteToolData(toolId: string): void {
    this.remove(`tool-${toolId}`);
  }
}

export const storage = new LocalStorage();
