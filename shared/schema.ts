// Shared types for DevToolNest
// All data is stored client-side in localStorage for standalone version

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  status: 'ready' | 'beta' | 'coming-soon';
}

export interface Collection {
  id: string;
  name: string;
  tool: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageItem {
  id: string;
  name: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types for client-server communication
export interface ApiResponse<T = any> {
  status: 'ok' | 'error';
  message?: string;
  data?: T;
}